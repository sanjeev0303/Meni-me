import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const imageItemSchema = z.object({
  url: z.string().url(),
  fileId: z.string().min(1),
});

const collectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must contain lowercase letters, numbers, or hyphens"),
  description: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  isPublished: z.boolean().default(true),
  image: imageItemSchema.nullable().optional(),
});

const serializeCollection = <T extends { imageUrl: string | null; imageFileId: string | null }>(collection: T) => ({
  ...collection,
  image:
    collection.imageUrl && collection.imageFileId
      ? {
          url: collection.imageUrl,
          fileId: collection.imageFileId,
        }
      : null,
});

export async function GET() {
  try {
    const collections = await prisma.collection.findMany({
      include: { parent: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(collections.map(serializeCollection));
  } catch (error) {
  console.error("[ADMIN_COLLECTION_GET]", error);
  return NextResponse.json({ message: "Failed to fetch collections" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = collectionSchema.parse(await request.json());

    const image = payload.image ?? null;

    const collection = await prisma.collection.create({
      data: {
        name: payload.name,
        slug: payload.slug,
        description: payload.description ?? undefined,
        parent: payload.parentId
          ? {
              connect: { id: payload.parentId },
            }
          : undefined,
        isPublished: payload.isPublished,
        imageUrl: image?.url ?? null,
        imageFileId: image?.fileId ?? null,
      },
      include: { parent: true },
    });

    return NextResponse.json(serializeCollection(collection), { status: 201 });
  } catch (error) {
  console.error("[ADMIN_COLLECTION_POST]", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", issues: error.issues }, { status: 422 });
    }

    return NextResponse.json({ message: "Failed to create collection" }, { status: 500 });
  }
}
