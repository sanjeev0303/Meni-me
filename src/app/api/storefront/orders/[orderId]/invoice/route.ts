import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth-helpers";
import { getInvoicePayload, renderInvoicePdf } from "@/server/invoice-service";

const paramsSchema = z.object({
  orderId: z.string().min(1),
});

export async function GET(_: Request, context: { params: Promise<{ orderId?: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { orderId } = paramsSchema.parse(params);

    const invoice = await getInvoicePayload(orderId);
    if (!invoice || invoice.customerId !== user.id) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (!invoice.fulfilledAt) {
      return NextResponse.json({ error: "Invoice will be available after delivery" }, { status: 403 });
    }

  const pdf = await renderInvoicePdf(invoice);
  const arrayBuffer = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: "application/pdf" });
    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.orderNumber}.pdf"`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    console.error("[storefront] Failed to generate invoice", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to generate invoice" }, { status: 500 });
  }
}
