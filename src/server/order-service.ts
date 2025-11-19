import { prisma } from "@/lib/db";
import { OrderStatus, PaymentStatus, Prisma } from "@/generated/prisma";

export type CreateOrderInput = {
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  paymentId?: string;
  orderId?: string;
  signature?: string;
  shippingAddress?: Record<string, unknown>;
  billingAddress?: Record<string, unknown>;
  notes?: string;
  currency?: string;
};

export type OrderSnapshot = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  total: number;
  currency: string;
  placedAt: Date;
};

export type UserOrderData = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  total: number;
  currency: string;
  placedAt: Date;
  items: OrderItemData[];
};

export type OrderItemData = {
  id: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  productName: string;
  productSku: string | null;
  selectedSize: string | null;
  selectedColor: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    mediaUrls: string[];
  };
};

export type OrderDetailData = UserOrderData & {
  shippingAddress: Record<string, unknown> | null;
  billingAddress: Record<string, unknown> | null;
  notes: string | null;
  fulfilledAt: Date | null;
  cancelledAt: Date | null;
};

const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

const ORDER_ITEM_SELECT = {
  id: true,
  quantity: true,
  unitPrice: true,
  lineTotal: true,
  productName: true,
  productSku: true,
  selectedSize: true,
  selectedColor: true,
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      mediaUrls: true,
    },
  },
} satisfies Prisma.OrderItemSelect;

const USER_ORDER_SELECT = {
  id: true,
  orderNumber: true,
  status: true,
  paymentStatus: true,
  subtotal: true,
  total: true,
  currency: true,
  placedAt: true,
  items: {
    select: ORDER_ITEM_SELECT,
  },
} satisfies Prisma.OrderSelect;

const USER_ORDER_DETAIL_SELECT = {
  ...USER_ORDER_SELECT,
  shippingAddress: true,
  billingAddress: true,
  notes: true,
  fulfilledAt: true,
  cancelledAt: true,
} satisfies Prisma.OrderSelect;

const mapOrderItem = (item: {
  id: string;
  quantity: number;
  unitPrice: Prisma.Decimal | number;
  lineTotal: Prisma.Decimal | number;
  productName: string;
  productSku: string | null;
  selectedSize: string | null;
  selectedColor: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
    price: Prisma.Decimal | number;
    mediaUrls: string[];
  };
}): OrderItemData => ({
  id: item.id,
  quantity: item.quantity,
  unitPrice: typeof item.unitPrice === "number" ? item.unitPrice : item.unitPrice.toNumber(),
  lineTotal: typeof item.lineTotal === "number" ? item.lineTotal : item.lineTotal.toNumber(),
  productName: item.productName,
  productSku: item.productSku,
  selectedSize: item.selectedSize,
  selectedColor: item.selectedColor,
  product: {
    id: item.product.id,
    name: item.product.name,
    slug: item.product.slug,
    price: typeof item.product.price === "number" ? item.product.price : item.product.price.toNumber(),
    mediaUrls: item.product.mediaUrls,
  },
});

const mapOrderBase = (order: {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: Prisma.Decimal | number;
  total: Prisma.Decimal | number;
  currency: string;
  placedAt: Date;
  items: Parameters<typeof mapOrderItem>[0][];
}): UserOrderData => ({
  id: order.id,
  orderNumber: order.orderNumber,
  status: order.status,
  paymentStatus: order.paymentStatus,
  subtotal: typeof order.subtotal === "number" ? order.subtotal : order.subtotal.toNumber(),
  total: typeof order.total === "number" ? order.total : order.total.toNumber(),
  currency: order.currency,
  placedAt: order.placedAt,
  items: order.items.map(mapOrderItem),
});

const mapOrderDetail = (order: {
  shippingAddress: Prisma.JsonValue | null;
  billingAddress: Prisma.JsonValue | null;
  notes: string | null;
  fulfilledAt: Date | null;
  cancelledAt: Date | null;
} & Parameters<typeof mapOrderBase>[0]): OrderDetailData => ({
  ...mapOrderBase(order),
  shippingAddress: order.shippingAddress && typeof order.shippingAddress === "object"
    ? (order.shippingAddress as Record<string, unknown>)
    : null,
  billingAddress: order.billingAddress && typeof order.billingAddress === "object"
    ? (order.billingAddress as Record<string, unknown>)
    : null,
  notes: order.notes ?? null,
  fulfilledAt: order.fulfilledAt,
  cancelledAt: order.cancelledAt,
});

export const createOrder = async (
  input: CreateOrderInput,
): Promise<OrderSnapshot> => {
  if (!input.userId.trim()) {
    throw new Error("User ID is required to create an order.");
  }

  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new Error("At least one order item is required.");
  }

  // Fetch product details for all items
  const productIds = input.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
    },
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      stock: true,
    },
  });

  if (products.length !== productIds.length) {
    throw new Error("One or more products not found.");
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Calculate totals and prepare order items
  let subtotal = 0;
  const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] = [];

  for (const item of input.items) {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new Error(`Product ${item.productId} not found.`);
    }

    if (product.stock < item.quantity) {
      throw new Error(
        `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
      );
    }

    const unitPrice = product.price.toNumber();
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;

    orderItems.push({
      quantity: item.quantity,
      unitPrice: new Prisma.Decimal(unitPrice),
      lineTotal: new Prisma.Decimal(lineTotal),
      productName: product.name,
      productSku: product.sku ?? undefined,
      product: {
        connect: { id: product.id },
      },
    });
  }

  const total = subtotal;
  const orderNumber = generateOrderNumber();

  // Create order with items in a transaction
  const order = await prisma.$transaction(async (tx) => {
    // Create the order
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        userId: input.userId,
        status: OrderStatus.PENDING,
        paymentStatus: input.paymentId ? PaymentStatus.PAID : PaymentStatus.PENDING,
        subtotal: new Prisma.Decimal(subtotal),
        total: new Prisma.Decimal(total),
        currency: input.currency ?? "INR",
        shippingAddress: input.shippingAddress as Prisma.InputJsonValue | undefined,
        billingAddress: input.billingAddress as Prisma.InputJsonValue | undefined,
        notes: input.notes ?? undefined,
        items: {
          create: orderItems,
        },
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        subtotal: true,
        total: true,
        currency: true,
        placedAt: true,
      },
    });

    // Reduce stock for each product
    for (const item of input.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    return newOrder;
  });

  // Note: Invoice email will be sent when order status is marked as DELIVERED
  // This is handled in the admin order update API

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    subtotal: order.subtotal.toNumber(),
    total: order.total.toNumber(),
    currency: order.currency,
    placedAt: order.placedAt,
  };
};

export const getUserOrders = async (userId: string): Promise<UserOrderData[]> => {
  if (!userId.trim()) {
    return [];
  }

  const orders = await prisma.order.findMany({
    where: { userId },
    select: USER_ORDER_SELECT,
    orderBy: {
      placedAt: 'desc', // Descending order (newest first)
    },
  });

  return orders.map(mapOrderBase);
};

export const getUserOrderById = async (
  userId: string,
  orderId: string,
): Promise<OrderDetailData | null> => {
  if (!userId.trim() || !orderId.trim()) {
    return null;
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    select: USER_ORDER_DETAIL_SELECT,
  });

  if (!order) {
    return null;
  }

  return mapOrderDetail(order);
};

export const cancelUserOrder = async (
  userId: string,
  orderId: string,
): Promise<OrderDetailData> => {
  if (!userId.trim() || !orderId.trim()) {
    throw new Error("Order not found");
  }

  const existingOrder = await prisma.order.findFirst({
    where: { id: orderId, userId },
    select: USER_ORDER_DETAIL_SELECT,
  });

  if (!existingOrder) {
    throw new Error("Order not found");
  }

  if (
    existingOrder.status === OrderStatus.CANCELLED ||
    existingOrder.status === OrderStatus.RETURNED ||
    existingOrder.status === OrderStatus.DELIVERED ||
    existingOrder.status === OrderStatus.SHIPPED
  ) {
    throw new Error("This order can no longer be cancelled.");
  }

  const shouldRefund = existingOrder.paymentStatus === PaymentStatus.PAID;

  const updated = await prisma.order.update({
    where: { id: existingOrder.id },
    data: {
      status: OrderStatus.CANCELLED,
      paymentStatus: shouldRefund ? PaymentStatus.REFUNDED : existingOrder.paymentStatus,
      cancelledAt: new Date(),
      fulfilledAt: null,
    },
    select: USER_ORDER_DETAIL_SELECT,
  });

  return mapOrderDetail(updated);
};
