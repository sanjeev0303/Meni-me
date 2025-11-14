import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole } from "@/generated/prisma";

const paramsSchema = z.object({
  userId: z.string().min(1),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  emailVerified: z.boolean().optional(),
  defaultAddressId: z.string().nullable().optional(),
  role: z.nativeEnum(UserRole).optional(),
});

export async function PATCH(request: Request, context: { params: Promise<unknown> }) {
  try {
    const params = await context.params;
    const { userId } = paramsSchema.parse(params);
    const payload = updateSchema.parse(await request.json());

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.emailVerified !== undefined ? { emailVerified: payload.emailVerified } : {}),
        ...(payload.role !== undefined ? { role: payload.role } : {}),
        ...(payload.defaultAddressId !== undefined
          ? { defaultAddressId: payload.defaultAddressId }
          : {}),
      },
      include: {
        addresses: true,
        defaultAddress: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[ADMIN_CUSTOMER_PATCH]", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", issues: error.issues }, { status: 422 });
    }

    return NextResponse.json({ message: "Failed to update customer" }, { status: 500 });
  }
}
