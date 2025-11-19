import { readFile } from "node:fs/promises";

import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFFont, PDFPage, RGB, rgb } from "pdf-lib";

import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/mail";

export type InvoiceAddress = {
  fullName?: string;
  streetLine1?: string;
  streetLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phoneNumber?: string;
  [key: string]: unknown;
} | null;

export type InvoiceItem = {
  id: string;
  productName: string;
  productSku: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  selectedSize: string | null;
  selectedColor: string | null;
};

export type InvoicePayload = {
  orderId: string;
  orderNumber: string;
  currency: string;
  subtotal: number;
  shippingFee: number | null;
  tax: number | null;
  total: number;
  placedAt: Date;
  fulfilledAt: Date | null;
  customerId: string;
  customerName: string | null;
  customerEmail: string;
  shippingAddress: InvoiceAddress;
  billingAddress: InvoiceAddress;
  items: InvoiceItem[];
};

const formatAmount = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
};

const normalizeAddress = (address?: unknown): InvoiceAddress => {
  if (!address || typeof address !== "object") {
    return null;
  }

  const record = address as Record<string, unknown>;
  const normalized: InvoiceAddress = {};
  for (const key of Object.keys(record)) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      normalized[key] = value.trim();
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : null;
};

export const getInvoicePayload = async (orderId: string): Promise<InvoicePayload | null> => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      items: true,
    },
  });

  if (!order || !order.user?.email) {
    return null;
  }

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    currency: order.currency,
    subtotal: order.subtotal.toNumber(),
    shippingFee: order.shippingFee?.toNumber() ?? null,
    tax: order.tax?.toNumber() ?? null,
    total: order.total.toNumber(),
    placedAt: order.placedAt,
    fulfilledAt: order.fulfilledAt,
    customerId: order.user.id,
    customerName: order.user.name,
    customerEmail: order.user.email,
    shippingAddress: normalizeAddress(order.shippingAddress),
    billingAddress: normalizeAddress(order.billingAddress),
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      productSku: item.productSku,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toNumber(),
      lineTotal: item.lineTotal.toNumber(),
      selectedSize: item.selectedSize,
      selectedColor: item.selectedColor,
    })),
  } satisfies InvoicePayload;
};

type InvoiceFonts = {
  regular: PDFFont;
  bold: PDFFont;
};

type FontVariant = keyof InvoiceFonts;

const fontFileMap: Record<FontVariant, URL> = {
  regular: new URL("../assets/fonts/NotoSans-Regular.ttf", import.meta.url),
  bold: new URL("../assets/fonts/NotoSans-Bold.ttf", import.meta.url),
};

const fontBytesCache: Partial<Record<FontVariant, Uint8Array>> = {};

const getFontBytes = async (variant: FontVariant) => {
  if (!fontBytesCache[variant]) {
    fontBytesCache[variant] = await readFile(fontFileMap[variant]);
  }
  return fontBytesCache[variant]!;
};

type AddressBlockOptions = {
  page: PDFPage;
  fonts: InvoiceFonts;
  title: string;
  address: InvoiceAddress;
  x: number;
  y: number;
  colors: {
    title: RGB;
    body: RGB;
  };
};

const getAddressLines = (address: InvoiceAddress): string[] => {
  if (!address) {
    return [];
  }

  const lines: string[] = [];
  if (address.fullName) lines.push(address.fullName);
  if (address.streetLine1) lines.push(address.streetLine1);
  if (address.streetLine2) lines.push(address.streetLine2);
  const cityLine = [address.city, address.state, address.postalCode].filter(Boolean).join(", ");
  if (cityLine) lines.push(cityLine);
  if (address.country) lines.push(address.country);
  if (address.phoneNumber) lines.push(`Phone: ${address.phoneNumber}`);
  return lines;
};

const drawAddressBlock = ({ page, fonts, title, address, x, y, colors }: AddressBlockOptions) => {
  page.drawText(title, {
    x,
    y,
    font: fonts.bold,
    size: 11,
    color: colors.title,
  });

  const lines = getAddressLines(address);
  let cursor = y - 14;
  const bodyColor = colors.body;

  if (!lines.length) {
    page.drawText("Not provided", {
      x,
      y: cursor,
      font: fonts.regular,
      size: 10,
      color: bodyColor,
    });
    cursor -= 12;
  } else {
    lines.forEach((line) => {
      page.drawText(line, {
        x,
        y: cursor,
        font: fonts.regular,
        size: 10,
        color: bodyColor,
      });
      cursor -= 12;
    });
  }

  return cursor;
};

export const renderInvoicePdf = async (invoice: InvoicePayload): Promise<Buffer> => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const fonts: InvoiceFonts = {
    regular: await pdfDoc.embedFont(await getFontBytes("regular"), { subset: true }),
    bold: await pdfDoc.embedFont(await getFontBytes("bold"), { subset: true }),
  };

  const colors = {
    headline: rgb(0.0588, 0.0901, 0.1647),
    subhead: rgb(0.1176, 0.1607, 0.2313),
    muted: rgb(0.2784, 0.3372, 0.4156),
    border: rgb(0.8, 0.835, 0.921),
  };

  const margin = 50;
  let page = pdfDoc.addPage();
  let { width, height } = page.getSize();
  let cursorY = height - margin;

  const ensureSpace = (needed: number, onNewPage?: () => void) => {
    if (cursorY - needed < margin) {
      page = pdfDoc.addPage();
      ({ width, height } = page.getSize());
      cursorY = height - margin;
      onNewPage?.();
    }
  };

  const drawTableHeader = () => {
    ensureSpace(30);
    const headerY = cursorY;
    const columns = {
      item: margin,
      details: margin + 210,
      qty: width - margin - 170,
      price: width - margin - 110,
      total: width - margin - 50,
    } as const;

    page.drawText("Item", { x: columns.item, y: headerY, font: fonts.bold, size: 10, color: colors.headline });
    page.drawText("Details", { x: columns.details, y: headerY, font: fonts.bold, size: 10, color: colors.headline });
    page.drawText("Qty", { x: columns.qty, y: headerY, font: fonts.bold, size: 10, color: colors.headline });
    page.drawText("Price", { x: columns.price, y: headerY, font: fonts.bold, size: 10, color: colors.headline });
    page.drawText("Total", { x: columns.total, y: headerY, font: fonts.bold, size: 10, color: colors.headline });

    page.drawLine({
      start: { x: margin, y: headerY - 4 },
      end: { x: width - margin, y: headerY - 4 },
      thickness: 1,
      color: colors.border,
    });

    cursorY = headerY - 18;
    return columns;
  };

  page.drawText("Meni-me", {
    x: margin,
    y: cursorY,
    font: fonts.bold,
    size: 20,
    color: colors.headline,
  });
  cursorY -= 26;

  page.drawText("Invoice", {
    x: margin,
    y: cursorY,
    font: fonts.bold,
    size: 16,
    color: colors.subhead,
  });
  cursorY -= 24;

  const metaLines = [
    `Order Number: ${invoice.orderNumber}`,
    `Issued: ${invoice.fulfilledAt ? invoice.fulfilledAt.toDateString() : new Date().toDateString()}`,
    `Placed: ${invoice.placedAt.toDateString()}`,
  ];
  metaLines.forEach((line) => {
    page.drawText(line, {
      x: margin,
      y: cursorY,
      font: fonts.regular,
      size: 10,
      color: colors.muted,
    });
    cursorY -= 14;
  });
  cursorY -= 6;

  const leftBlockBottom = drawAddressBlock({
    page,
    fonts,
    title: "Bill to",
    address: invoice.billingAddress ?? invoice.shippingAddress,
    x: margin,
    y: cursorY,
    colors: { title: colors.headline, body: colors.muted },
  });
  const rightBlockBottom = drawAddressBlock({
    page,
    fonts,
    title: "Ship to",
    address: invoice.shippingAddress ?? invoice.billingAddress,
    x: margin + 250,
    y: cursorY,
    colors: { title: colors.headline, body: colors.muted },
  });
  cursorY = Math.min(leftBlockBottom, rightBlockBottom) - 20;

  let columns = drawTableHeader();
  invoice.items.forEach((item) => {
    ensureSpace(22, () => {
      columns = drawTableHeader();
    });

    page.drawText(item.productName, {
      x: columns.item,
      y: cursorY,
      font: fonts.regular,
      size: 10,
      color: colors.subhead,
    });

    const details = [
      item.productSku ? `SKU ${item.productSku}` : null,
      item.selectedSize ? `Size ${item.selectedSize}` : null,
      item.selectedColor ? `Color ${item.selectedColor}` : null,
    ]
      .filter(Boolean)
      .join(" • ") || "—";
    page.drawText(details, {
      x: columns.details,
      y: cursorY,
      font: fonts.regular,
      size: 10,
      color: colors.muted,
    });

    page.drawText(item.quantity.toString(), {
      x: columns.qty,
      y: cursorY,
      font: fonts.regular,
      size: 10,
      color: colors.subhead,
    });

    page.drawText(formatAmount(item.unitPrice, invoice.currency), {
      x: columns.price,
      y: cursorY,
      font: fonts.regular,
      size: 10,
      color: colors.subhead,
    });

    page.drawText(formatAmount(item.lineTotal, invoice.currency), {
      x: columns.total,
      y: cursorY,
      font: fonts.regular,
      size: 10,
      color: colors.subhead,
    });

    cursorY -= 18;
  });

  cursorY -= 12;
  ensureSpace(120);
  const summaryX = width - margin - 200;
  let summaryY = cursorY;
  const summaryRows = [
    { label: "Subtotal", value: formatAmount(invoice.subtotal, invoice.currency) },
    ...(typeof invoice.shippingFee === "number"
      ? [{ label: "Shipping", value: formatAmount(invoice.shippingFee, invoice.currency) }]
      : []),
    ...(typeof invoice.tax === "number"
      ? [{ label: "Tax", value: formatAmount(invoice.tax, invoice.currency) }]
      : []),
    { label: "Total", value: formatAmount(invoice.total, invoice.currency), bold: true },
  ];

  summaryRows.forEach(({ label, value, bold }) => {
    const font = bold ? fonts.bold : fonts.regular;
    summaryY -= 16;
    page.drawText(label, {
      x: summaryX,
      y: summaryY,
      font,
      size: 11,
      color: colors.subhead,
    });
    page.drawText(value, {
      x: summaryX + 110,
      y: summaryY,
      font,
      size: 11,
      color: colors.subhead,
    });
  });

  cursorY = summaryY - 24;
  ensureSpace(60);
  page.drawText(
    "Thank you for shopping with Meni-me. Reach out to our concierge team if you have any questions about this invoice.",
    {
      x: margin,
      y: cursorY,
      font: fonts.regular,
      size: 10,
      color: colors.muted,
      maxWidth: width - margin * 2,
    },
  );

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};

export const generateInvoiceBuffer = async (orderId: string) => {
  const payload = await getInvoicePayload(orderId);
  if (!payload) {
    return null;
  }

  const buffer = await renderInvoicePdf(payload);
  return { payload, buffer };
};

export const sendInvoiceEmail = async (orderId: string): Promise<boolean> => {
  const result = await generateInvoiceBuffer(orderId);
  if (!result) {
    return false;
  }

  const { payload, buffer } = result;
  const attachmentContent = buffer.toString("base64");

  const greetingName = payload.customerName?.split(" ").shift() ?? "there";
  const subject = `Your Meni-me invoice (${payload.orderNumber})`;
  const html = `
    <p>Hi ${greetingName},</p>
    <p>Thanks for letting us dress your moments. Your order <strong>${payload.orderNumber}</strong> is now complete.</p>
    <p>The attached invoice captures every line item for your records. Keep it handy for returns, exchanges, or expense claims.</p>
    <p>Need something else? Reply to this email and our concierge will jump in.</p>
    <p>— Meni-me Concierge</p>
  `;
  const text = `Hi ${greetingName},\n\nYour order ${payload.orderNumber} is complete. The attached PDF is your invoice for the purchase.\n\n— Meni-me Concierge`;

  await sendEmail({
    to: payload.customerEmail,
    subject,
    html,
    text,
    attachments: [
      {
        filename: `${payload.orderNumber}.pdf`,
        content: attachmentContent,
        type: "application/pdf",
      },
    ],
  });

  return true;
};
