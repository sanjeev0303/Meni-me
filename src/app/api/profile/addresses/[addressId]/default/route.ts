import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth-helpers";

type RouteContext = {
  params: Promise<{
    addressId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { addressId } = await context.params;

    const address = await prisma.userAddress.findUnique({
      where: { id: addressId },
      select: {
        userId: true,
      },
    });

    if (!address || address.userId !== user.id) {
      return NextResponse.json({ message: "Address not found" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        defaultAddressId: addressId,
      },
      select: {
        defaultAddressId: true,
      },
    });

    return NextResponse.json({
      defaultAddressId: updated.defaultAddressId,
    });
  } catch (error) {
    console.error("[PROFILE_ADDRESS_SET_DEFAULT]", error);
    return NextResponse.json({ message: "Failed to set default address" }, { status: 500 });
  }
}
