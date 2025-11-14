import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { Prisma } from "@/generated/prisma";
import { deleteImageKitFile } from "@/lib/imagekit";

const productIdSchema = z.object({
  productId: z.string().min(1),
});

const mediaItemSchema = z.object({
  url: z.string().url(),
  fileId: z.string().min(1),
});

const productUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  price: z.union([z.coerce.number(), z.string()]).optional(),
  compareAtPrice: z
    .union([z.coerce.number().optional(), z.string().optional(), z.null()])
    .optional(),
  stock: z.union([z.coerce.number().int().nonnegative(), z.string()]).optional(),
  media: z.array(mediaItemSchema).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  mediaFileIds: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
  categoryIds: z.array(z.string().min(1)).optional(),
});

const toDecimal = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  if (typeof value === "number") {
    return new Prisma.Decimal(value.toFixed(2));
  }

  const numeric = Number(value);

  if (Number.isNaN(numeric)) {
    throw new Error("Invalid numeric value");
  }

  return new Prisma.Decimal(numeric.toFixed(2));
};

export async function GET(_: Request, context: { params: Promise<unknown> }) {
  try {
    const params = await context.params;
    const { productId } = productIdSchema.parse(params);
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...product,
      price: product.price.toNumber(),
      compareAtPrice: product.compareAtPrice?.toNumber() ?? null,
      media: product.mediaUrls.map((url, index) => ({
        url,
        fileId: product.mediaFileIds[index] ?? "",
      })),
      categories: product.categories.map((pivot) => pivot.category),
    });
  } catch (error) {
    console.error("[ADMIN_PRODUCT_GET]", error);
    return NextResponse.json({ message: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<unknown> }) {
  try {
    const params = await context.params;
    const { productId } = productIdSchema.parse(params);
    const payload = productUpdateSchema.parse(await request.json());

    const updates: Record<string, unknown> = {};

    if (payload.name !== undefined) updates.name = payload.name;
    if (payload.slug !== undefined) updates.slug = payload.slug;
    if (payload.description !== undefined) updates.description = payload.description ?? null;
    if (payload.sku !== undefined) updates.sku = payload.sku ?? null;
    if (payload.price !== undefined) updates.price = toDecimal(payload.price);
    if (payload.compareAtPrice !== undefined)
      updates.compareAtPrice =
        payload.compareAtPrice === null ? null : toDecimal(payload.compareAtPrice);
    if (payload.stock !== undefined)
      updates.stock = typeof payload.stock === "string" ? Number(payload.stock) : payload.stock;
    if (payload.media !== undefined || payload.mediaUrls !== undefined) {
      const media = payload.media
        ? payload.media
        : (payload.mediaUrls ?? []).map((url, index) => ({
            url,
            fileId: payload.mediaFileIds?.[index] ?? "",
          }));

      updates.mediaUrls = media.map((item) => item.url);
      updates.mediaFileIds = media.map((item) => item.fileId ?? "");
    }
  if (payload.isPublished !== undefined) updates.isPublished = payload.isPublished;

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id: productId },
        data: updates,
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
      });

      if (payload.categoryIds) {
        await tx.productCategory.deleteMany({ where: { productId } });
        if (payload.categoryIds.length > 0) {
          await tx.productCategory.createMany({
            data: payload.categoryIds.map((categoryId) => ({
              productId,
              categoryId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return product;
    });

    const categories = await prisma.productCategory.findMany({
      where: { productId },
      include: { category: true },
    });

    return NextResponse.json({
      ...result,
      price: result.price.toNumber(),
      compareAtPrice: result.compareAtPrice?.toNumber() ?? null,
      media: result.mediaUrls.map((url, index) => ({
        url,
        fileId: result.mediaFileIds[index] ?? "",
      })),
      categories: categories.map((pivot) => pivot.category),
    });
  } catch (error) {
    console.error("[ADMIN_PRODUCT_PATCH]", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", issues: error.issues }, { status: 422 });
    }

    return NextResponse.json({ message: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: { params: Promise<unknown> }) {
  try {
    const params = await context.params;
    const { productId } = productIdSchema.parse(params);

    const existing = await prisma.product.findUnique({
      where: { id: productId },
      select: { mediaFileIds: true },
    });

    if (existing?.mediaFileIds?.length) {
      await Promise.all(existing.mediaFileIds.map((fileId) => deleteImageKitFile(fileId)));
    }

    await prisma.product.delete({ where: { id: productId } });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[ADMIN_PRODUCT_DELETE]", error);
    return NextResponse.json({ message: "Failed to delete product" }, { status: 500 });
  }
}
