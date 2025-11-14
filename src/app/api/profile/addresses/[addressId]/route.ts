import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth-helpers";
import {
  updateAddressSchema,
  type UpdateAddressInput,
} from "@/lib/validators/profile";
import {
  formatProfileAddress,
  profileAddressSelect,
  type RawProfile,
} from "@/server/profile-service";
import { Prisma } from "@/generated/prisma";

const sanitizeOptional = (value: string | null | undefined) => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const parseBody = async (request: Request) => {
  const json = (await request.json().catch(() => ({}))) as
    | UpdateAddressInput
    | (UpdateAddressInput & Record<string, unknown>)
    | undefined;

  if (json && typeof json === "object" && "phoneNumber" in json) {
    const phone = json.phoneNumber;
    if (typeof phone === "string" && phone.trim().length === 0) {
      json.phoneNumber = null;
    }
  }

  return updateAddressSchema.safeParse(json);
};

type RouteContext = {
  params: Promise<{
    addressId: string;
  }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const parsed = await parseBody(request);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid input", errors: parsed.error.flatten() }, { status: 400 });
    }

    const { addressId } = await context.params;

    const existing = await prisma.userAddress.findUnique({
      where: { id: addressId },
      select: {
        userId: true,
      },
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ message: "Address not found" }, { status: 404 });
    }

    const payload = parsed.data;

    const { setDefault, ...fields } = payload as UpdateAddressInput & {
      setDefault?: boolean;
    };

    const updateData: Record<string, string | null> = {};

    if (Object.prototype.hasOwnProperty.call(fields, "label")) {
      updateData.label = sanitizeOptional(fields.label ?? null);
    }

    if (typeof fields.fullName === "string") {
      updateData.fullName = fields.fullName.trim();
    }

    if (Object.prototype.hasOwnProperty.call(fields, "phoneNumber")) {
      updateData.phoneNumber = sanitizeOptional(fields.phoneNumber);
    }

    if (typeof fields.streetLine1 === "string") {
      updateData.streetLine1 = fields.streetLine1.trim();
    }

    if (Object.prototype.hasOwnProperty.call(fields, "streetLine2")) {
      updateData.streetLine2 = sanitizeOptional(fields.streetLine2);
    }

    if (typeof fields.city === "string") {
      updateData.city = fields.city.trim();
    }

    if (Object.prototype.hasOwnProperty.call(fields, "state")) {
      updateData.state = sanitizeOptional(fields.state);
    }

    if (Object.prototype.hasOwnProperty.call(fields, "postalCode")) {
      updateData.postalCode = sanitizeOptional(fields.postalCode);
    }

    if (typeof fields.country === "string") {
      updateData.country = fields.country.trim();
    }

    if (
      Object.keys(updateData).length === 0 &&
      typeof setDefault === "undefined"
    ) {
      return NextResponse.json(
        { message: "No address fields provided" },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction<{
      addressRecord: RawProfile["addresses"][number];
      defaultAddressId: string | null;
    }>(async (tx: Prisma.TransactionClient) => {
      const addressRecord =
        Object.keys(updateData).length > 0
          ? await tx.userAddress.update({
              where: { id: addressId },
              data: updateData,
              select: profileAddressSelect,
            })
          : await tx.userAddress.findUnique({
              where: { id: addressId },
              select: profileAddressSelect,
            });

      if (!addressRecord) {
        throw new Error("Address not found after update");
      }

      let defaultAddressId = (
        await tx.user.findUnique({
          where: { id: user.id },
          select: { defaultAddressId: true },
        })
      )?.defaultAddressId;

      if (setDefault === true && defaultAddressId !== addressId) {
        defaultAddressId = (
          await tx.user.update({
            where: { id: user.id },
            data: {
              defaultAddressId: addressId,
            },
            select: { defaultAddressId: true },
          })
        ).defaultAddressId;
      }

      return { addressRecord, defaultAddressId: defaultAddressId ?? null };
    });

    return NextResponse.json(
      formatProfileAddress(result.addressRecord, result.defaultAddressId),
    );
  } catch (error) {
    console.error("[PROFILE_ADDRESS_PUT]", error);
    return NextResponse.json({ message: "Failed to update address" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { addressId } = await context.params;

    const address = await prisma.userAddress.findUnique({
      where: { id: addressId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!address || address.userId !== user.id) {
      return NextResponse.json({ message: "Address not found" }, { status: 404 });
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        defaultAddressId: true,
      },
    });

    let nextDefaultId = userRecord?.defaultAddressId ?? null;

    await prisma.$transaction(async (tx: Prisma.TransactionClient): Promise<void> => {
      await tx.userAddress.delete({ where: { id: addressId } });

      if (userRecord?.defaultAddressId === addressId) {
        const fallback = await tx.userAddress.findFirst({
          where: {
            userId: user.id,
          },
          orderBy: { createdAt: "desc" },
        });

        nextDefaultId = fallback?.id ?? null;

        await tx.user.update({
          where: { id: user.id },
          data: {
            defaultAddressId: nextDefaultId,
          },
        });
      }
    });

    return NextResponse.json({ deleted: true, defaultAddressId: nextDefaultId });
  } catch (error) {
    console.error("[PROFILE_ADDRESS_DELETE]", error);
    return NextResponse.json({ message: "Failed to delete address" }, { status: 500 });
  }
}
