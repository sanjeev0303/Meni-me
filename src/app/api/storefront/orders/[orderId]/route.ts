import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth-helpers";
import { cancelUserOrder, getUserOrderById } from "@/server/order-service";

const paramsSchema = z.object({
  orderId: z.string().min(1),
});

const patchSchema = z.object({
  action: z.literal("cancel"),
});

export async function GET(_: Request, context: { params: Promise<{ orderId?: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { orderId } = paramsSchema.parse(params);

    const order = await getUserOrderById(user.id, orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error("[storefront] Failed to fetch order", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to fetch order" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ orderId?: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { orderId } = paramsSchema.parse(params);

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const { action } = patchSchema.parse(payload);
    if (action !== "cancel") {
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }

    const order = await cancelUserOrder(user.id, orderId);
    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error("[storefront] Failed to update order", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (error instanceof Error && error.message === "Order not found") {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (error instanceof Error && error.message.includes("no longer be cancelled")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to update order" }, { status: 500 });
  }
}
