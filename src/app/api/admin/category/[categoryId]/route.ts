import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { deleteImageKitFile } from "@/lib/imagekit";

const paramsSchema = z.object({
  categoryId: z.string().min(1),
});

const imageItemSchema = z.object({
  url: z.string().url(),
  fileId: z.string().min(1),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
  image: imageItemSchema.nullable().optional(),
});

const serializeCategory = <T extends { imageUrl: string | null; imageFileId: string | null }>(category: T) => ({
  ...category,
  image:
    category.imageUrl && category.imageFileId
      ? {
          url: category.imageUrl,
          fileId: category.imageFileId,
        }
      : null,
});

export async function PATCH(request: Request, context: { params: Promise<unknown> }) {
  try {
    const params = await context.params;
    const { categoryId } = paramsSchema.parse(params);
    const payload = updateSchema.parse(await request.json());

    if (payload.parentId === categoryId) {
      return NextResponse.json(
        { message: "A category cannot be its own parent" },
        { status: 400 },
      );
    }

    const existing = await prisma.category.findUnique({
      where: { id: categoryId },
      select: {
        imageFileId: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (payload.name !== undefined) data.name = payload.name;
    if (payload.slug !== undefined) data.slug = payload.slug;
    if (payload.description !== undefined) data.description = payload.description;
    if (payload.isPublished !== undefined) data.isPublished = payload.isPublished;

    if (payload.parentId !== undefined) {
      data.parent = payload.parentId
        ? {
            connect: { id: payload.parentId },
          }
        : {
            disconnect: true,
          };
    }

    let fileIdToDelete: string | null = null;

    if (payload.image !== undefined) {
      if (payload.image === null) {
        if (existing.imageFileId) {
          fileIdToDelete = existing.imageFileId;
        }
        data.imageUrl = null;
        data.imageFileId = null;
      } else {
        data.imageUrl = payload.image.url;
        data.imageFileId = payload.image.fileId;
        if (existing.imageFileId && existing.imageFileId !== payload.image.fileId) {
          fileIdToDelete = existing.imageFileId;
        }
      }
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data,
      include: { parent: true },
    });

    if (fileIdToDelete) {
      await deleteImageKitFile(fileIdToDelete);
    }

    return NextResponse.json(serializeCategory(category));
  } catch (error) {
    console.error("[ADMIN_CATEGORY_PATCH]", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", issues: error.issues }, { status: 422 });
    }

    return NextResponse.json({ message: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: { params: Promise<unknown> }) {
  try {
    const params = await context.params;
    const { categoryId } = paramsSchema.parse(params);

    const existing = await prisma.category.findUnique({
      where: { id: categoryId },
      select: {
        imageFileId: true,
      },
    });

    if (existing?.imageFileId) {
      await deleteImageKitFile(existing.imageFileId);
    }

    await prisma.category.delete({ where: { id: categoryId } });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[ADMIN_CATEGORY_DELETE]", error);
    return NextResponse.json({ message: "Failed to delete category" }, { status: 500 });
  }
}
