import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { Prisma, OrderStatus, PaymentStatus } from "@/generated/prisma";

const paramsSchema = z.object({
  orderId: z.string().min(1),
});

const updateSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  notes: z.string().optional().nullable(),
});

export async function PATCH(request: Request, context: { params: Promise<unknown> }) {
  try {
    const params = await context.params;
    const { orderId } = paramsSchema.parse(params);
    const payload = updateSchema.parse(await request.json());

    const data: Prisma.OrderUpdateInput = {};

    if (payload.status) {
      data.status = payload.status;

      if (payload.status === OrderStatus.DELIVERED) {
        data.fulfilledAt = new Date();
        data.cancelledAt = null;
      }

      if (payload.status === OrderStatus.CANCELLED) {
        data.cancelledAt = new Date();
        data.fulfilledAt = null;
      }
    }

    if (payload.paymentStatus) {
      data.paymentStatus = payload.paymentStatus;
    }

    if (payload.notes !== undefined) {
      data.notes = payload.notes;
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data,
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("[ADMIN_ORDER_PATCH]", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", issues: error.issues }, { status: 422 });
    }

    return NextResponse.json({ message: "Failed to update order" }, { status: 500 });
  }
}
