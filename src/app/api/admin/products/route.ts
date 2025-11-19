import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { Prisma } from "@/generated/prisma";

const mediaItemSchema = z.object({
  url: z.string().url(),
  fileId: z.string().min(1),
});

const baseProductInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must contain lowercase characters, numbers, or hyphens"),
  description: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  price: z.union([z.coerce.number(), z.string()]),
  compareAtPrice: z
    .union([z.coerce.number().optional(), z.string().optional(), z.null()])
    .optional(),
  stock: z.union([z.coerce.number().int().nonnegative(), z.string()]).default(0),
  media: z.array(mediaItemSchema).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  mediaFileIds: z.array(z.string().min(1)).optional(),
  isPublished: z.boolean().default(true),
  collectionIds: z.array(z.string().min(1)).default([]),
  sizeOptions: z.array(z.string().min(1)).default([]),
  colorOptions: z.array(z.string().min(1)).default([]),
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

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        collections: {
          include: {
            collection: true,
          },
        },
      },
    });

    const serialised = products.map((product) => ({
      ...product,
      price: product.price.toNumber(),
      compareAtPrice: product.compareAtPrice?.toNumber() ?? null,
      media: product.mediaUrls.map((url, index) => ({
        url,
        fileId: product.mediaFileIds[index] ?? "",
      })),
      collections: product.collections.map((pivot) => pivot.collection),
      sizeOptions: product.sizeOptions ?? [],
      colorOptions: product.colorOptions ?? [],
    }));

    return NextResponse.json(serialised);
  } catch (error) {
    console.error("[ADMIN_PRODUCTS_GET]", error);
    return NextResponse.json({ message: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = baseProductInputSchema.parse(json);

    const media = payload.media
      ? payload.media
      : (payload.mediaUrls ?? []).map((url, index) => ({
          url,
          fileId: payload.mediaFileIds?.[index] ?? "",
        }));

    const product = await prisma.product.create({
      data: {
        name: payload.name,
        slug: payload.slug,
        description: payload.description ?? undefined,
        sku: payload.sku ?? undefined,
        price: toDecimal(payload.price)!,
        compareAtPrice: toDecimal(payload.compareAtPrice ?? undefined),
        stock: typeof payload.stock === "string" ? Number(payload.stock) : payload.stock,
        mediaUrls: media.map((item) => item.url),
        mediaFileIds: media.map((item) => item.fileId ?? ""),
        isPublished: payload.isPublished,
        sizeOptions: payload.sizeOptions ?? [],
        colorOptions: payload.colorOptions ?? [],
        collections: {
          create: payload.collectionIds.map((collectionId) => ({
            collection: {
              connect: { id: collectionId },
            },
          })),
        },
      },
      include: {
        collections: {
          include: {
            collection: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        ...product,
        price: product.price.toNumber(),
        compareAtPrice: product.compareAtPrice?.toNumber() ?? null,
        media: product.mediaUrls.map((url, index) => ({
          url,
          fileId: product.mediaFileIds[index] ?? "",
        })),
        collections: product.collections.map((pivot) => pivot.collection),
        sizeOptions: product.sizeOptions ?? [],
        colorOptions: product.colorOptions ?? [],
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[ADMIN_PRODUCTS_POST]", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", issues: error.issues }, { status: 422 });
    }

    return NextResponse.json({ message: "Failed to create product" }, { status: 500 });
  }
}
