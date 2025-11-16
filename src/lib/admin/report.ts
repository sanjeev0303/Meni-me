import { prisma } from "@/lib/db";

type AdminReportSummary = {
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    fulfilledOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    fulfillmentRate: number;
    abandonedCarts: number;
  };
  revenueTrend: { label: string; value: number }[];
  topProducts: Array<{
    id: string;
    name: string;
    quantitySold: number;
    revenue: number;
    stock: number;
    price: number;
  }>;
  collectionPerformance: Array<{ id: string; name: string; quantitySold: number }>;
  newCustomers: Array<{
    id: string;
    name: string;
    createdAt: Date;
    lifetimeValue: number;
    orderCount: number;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    subtotal: number;
    shippingFee: number | null;
    tax: number | null;
    total: number;
    [key: string]: unknown;
  }>;
  orderTotals: {
    quantity: number;
    revenue: number;
  };
};

const getMonthlyBuckets = (months: number) => {
  const now = new Date();
  const buckets: { key: string; start: Date; end: Date }[] = [];

  for (let i = months - 1; i >= 0; i -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const key = start.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    buckets.push({ key, start, end });
  }

  return buckets;
};

const createEmptyReportSummary = (months: number): AdminReportSummary => ({
  kpis: {
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    fulfilledOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    fulfillmentRate: 0,
    abandonedCarts: 0,
  },
  revenueTrend: getMonthlyBuckets(months).map((bucket) => ({ label: bucket.key, value: 0 })),
  topProducts: [],
  collectionPerformance: [],
  newCustomers: [],
  recentOrders: [],
  orderTotals: { quantity: 0, revenue: 0 },
});

const isPrismaConnectionError = (error: unknown) => {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const maybeError = error as { code?: string; message?: string };
  if (maybeError.code && ["P1000", "P1001", "P1002", "P1008"].includes(maybeError.code)) {
    return true;
  }

  return typeof maybeError.message === "string" && maybeError.message.includes("Can't reach database server");
};

export const getAdminReportSummary = async (months = 6): Promise<AdminReportSummary> => {
  try {
    const [orderAggregate, totalOrders, fulfilledOrders, pendingOrders, cancelledOrders, recentOrders, cartWithItems, products, collections, users, orderItems] =
      await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
      }),
      prisma.order.count(),
      prisma.order.count({ where: { status: "DELIVERED" } }),
      prisma.order.count({ where: { status: { in: ["PENDING", "PROCESSING"] } } }),
      prisma.order.count({ where: { status: "CANCELLED" } }),
      prisma.order.findMany({
        orderBy: { placedAt: "desc" },
        take: 10,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.cart.count({ where: { items: { some: {} } } }),
      prisma.product.findMany({
        select: {
          id: true,
          name: true,
          stock: true,
          price: true,
          orderItems: {
            select: { quantity: true, lineTotal: true },
          },
        },
      }),
      prisma.collection.findMany({
        select: {
          id: true,
          name: true,
          products: {
            select: {
              product: {
                select: {
                  orderItems: {
                    select: { quantity: true },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          createdAt: true,
          orders: {
            select: {
              total: true,
              placedAt: true,
            },
          },
        },
      }),
        prisma.orderItem.findMany({
          select: {
            productId: true,
            quantity: true,
            lineTotal: true,
          },
        }),
      ]);

    const totalRevenue = orderAggregate._sum.total?.toNumber() ?? 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const revenueBuckets = getMonthlyBuckets(months);
    const ordersForTrend = await prisma.order.findMany({
      where: {
        placedAt: {
          gte: revenueBuckets[0]?.start,
        },
      },
      select: {
        placedAt: true,
        total: true,
      },
    });

    const revenueTrend = revenueBuckets.map((bucket) => {
      const bucketTotal = ordersForTrend
        .filter((order) => order.placedAt >= bucket.start && order.placedAt < bucket.end)
        .reduce((sum, order) => sum + order.total.toNumber(), 0);

      return {
        label: bucket.key,
        value: bucketTotal,
      };
    });

    const topProducts = products
      .map((product) => {
        const quantitySold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
        const revenue = product.orderItems.reduce((sum, item) => sum + item.lineTotal.toNumber(), 0);
        return {
          id: product.id,
          name: product.name,
          quantitySold,
          revenue,
          stock: product.stock,
          price: product.price.toNumber(),
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const collectionPerformance = collections.map((collection) => {
      const quantitySold = collection.products.reduce(
        (sum, pivot) =>
          sum + pivot.product.orderItems.reduce((acc, item) => acc + item.quantity, 0),
        0,
      );

      return {
        id: collection.id,
        name: collection.name,
        quantitySold,
      };
    });

    const newCustomers = users
      .map((user) => ({
        id: user.id,
        name: user.name,
        createdAt: user.createdAt,
        lifetimeValue: user.orders.reduce((sum, order) => sum + order.total.toNumber(), 0),
        orderCount: user.orders.length,
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 8);

    const fulfillmentRate = totalOrders > 0 ? (fulfilledOrders / totalOrders) * 100 : 0;

    const recentOrdersFormatted = recentOrders.map((order) => ({
      ...order,
      subtotal: order.subtotal.toNumber(),
      shippingFee: order.shippingFee?.toNumber() ?? null,
      tax: order.tax?.toNumber() ?? null,
      total: order.total.toNumber(),
    }));

    return {
      kpis: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        fulfilledOrders,
        pendingOrders,
        cancelledOrders,
        fulfillmentRate,
        abandonedCarts: cartWithItems,
      },
      revenueTrend,
      topProducts,
      collectionPerformance,
      newCustomers,
      recentOrders: recentOrdersFormatted,
      orderTotals: orderItems.reduce(
        (acc, item) => {
          const quantity = acc.quantity + item.quantity;
          const revenue = acc.revenue + item.lineTotal.toNumber();
          return { quantity, revenue };
        },
        { quantity: 0, revenue: 0 },
      ),
    };
  } catch (error) {
    console.warn("[getAdminReportSummary] Falling back to empty summary", error);
    if (isPrismaConnectionError(error)) {
      return createEmptyReportSummary(months);
    }

    throw error;
  }
};
