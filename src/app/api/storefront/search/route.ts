import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Search products by name, description, SKU, or collection name
    const products = await prisma.product.findMany({
      where: {
        isPublished: true,
        OR: [
          {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            sku: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            collections: {
              some: {
                collection: {
                  name: {
                    contains: query,
                    mode: "insensitive",
                  },
                  isPublished: true,
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        compareAtPrice: true,
        mediaUrls: true,
        stock: true,
        collections: {
          where: {
            collection: {
              isPublished: true,
            },
          },
          select: {
            collection: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
          take: 1,
        },
      },
      take: limit,
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
    });

    const results = products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      image: product.mediaUrls?.[0] || null,
      stock: product.stock,
      category: product.collections[0]?.collection.name || null,
      categorySlug: product.collections[0]?.collection.slug || null,
    }));

    return NextResponse.json({
      query,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("[SEARCH] Error searching products:", error);
    return NextResponse.json(
      { error: "Failed to search products" },
      { status: 500 }
    );
  }
}
