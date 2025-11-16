import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";

type StorefrontImage = {
  url: string;
  fileId: string | null;
};

type StorefrontCollection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: StorefrontImage | null;
  parent?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  productCount?: number;
};

type StorefrontProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  media: StorefrontImage[];
  sku: string | null;
  stock: number;
  collections: StorefrontCollection[];
  createdAt: Date;
  averageRating: number | null;
  reviewCount: number;
};

type StorefrontReview = {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    image: string | null;
  } | null;
};

type RawCollectionBase = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  imageFileId: string | null;
  parent?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  _count?: {
    products?: number;
  };
};

type RawProductBase = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: Prisma.Decimal;
  compareAtPrice: Prisma.Decimal | null;
  mediaUrls: string[];
  mediaFileIds: string[];
  sku: string | null;
  stock: number;
  createdAt: Date;
  collections: Array<{
    collection: RawCollectionBase;
  }>;
};

type ProductRatingSummary = {
  averageRating: number | null;
  reviewCount: number;
};

const mapImage = (url: string | null, fileId: string | null): StorefrontImage | null => {
  if (!url) {
    return null;
  }

  return {
    url,
    fileId,
  } satisfies StorefrontImage;
};

const mapCollectionFromRaw = (
  collection: RawCollectionBase,
  overrides: { productCount?: number } = {},
): StorefrontCollection => {
  const productCount = overrides.productCount ?? collection._count?.products;

  return {
    id: collection.id,
    name: collection.name,
    slug: collection.slug,
    description: collection.description ?? null,
    image: mapImage(collection.imageUrl, collection.imageFileId),
    parent: collection.parent ?? null,
    productCount: typeof productCount === "number" ? productCount : undefined,
  } satisfies StorefrontCollection;
};

const mapProductFromRaw = (product: RawProductBase, rating?: ProductRatingSummary): StorefrontProduct => {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? null,
    price: product.price.toNumber(),
    compareAtPrice: product.compareAtPrice ? product.compareAtPrice.toNumber() : null,
    media: product.mediaUrls.map((url, index) => ({
      url,
      fileId: product.mediaFileIds[index] ?? null,
    })),
    sku: product.sku ?? null,
    stock: product.stock,
    collections: product.collections.map(({ collection }) =>
      mapCollectionFromRaw({
        ...collection,
        parent: collection.parent ?? null,
      }),
    ),
    createdAt: product.createdAt,
    averageRating: rating?.averageRating ?? null,
    reviewCount: rating?.reviewCount ?? 0,
  } satisfies StorefrontProduct;
};

const buildRatingSummaryMap = async (
  productIds: string[],
): Promise<Record<string, ProductRatingSummary>> => {
  if (!productIds.length) {
    return {};
  }

  const stats = await prisma.review.groupBy({
    by: ["productId"],
    where: {
      productId: {
        in: productIds,
      },
    },
    _avg: {
      rating: true,
    },
    _count: {
      rating: true,
    },
  });

  return stats.reduce<Record<string, ProductRatingSummary>>((acc, stat) => {
    const average = stat._avg.rating;

    let averageValue: number | null = null;
    if (average !== null) {
      const numericAverage = typeof average === "number"
        ? average
        : (average as Prisma.Decimal).toNumber();

      averageValue = Number.isFinite(numericAverage) ? numericAverage : null;
    }

    acc[stat.productId] = {
      averageRating: averageValue,
      reviewCount: stat._count.rating ?? 0,
    } satisfies ProductRatingSummary;

    return acc;
  }, {});
};

export const getStorefrontCollections = async (): Promise<StorefrontCollection[]> => {
  const collections = await prisma.collection.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      imageFileId: true,
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return collections.map((collection) =>
    mapCollectionFromRaw(collection, { productCount: collection._count?.products }),
  );
};

export const getCollectionWithProductsBySlug = async (slug: string) => {
  const collection = await prisma.collection.findUnique({
    where: { slug, isPublished: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      imageFileId: true,
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      children: {
        where: { isPublished: true },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          imageUrl: true,
          imageFileId: true,
          _count: {
            select: {
              products: true,
            },
          },
        },
        orderBy: { name: "asc" },
      },
      products: {
        where: { product: { isPublished: true } },
        select: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              price: true,
              compareAtPrice: true,
              mediaUrls: true,
              mediaFileIds: true,
              sku: true,
              stock: true,
              createdAt: true,
              collections: {
                where: { collection: { isPublished: true } },
                select: {
                  collection: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      description: true,
                      imageUrl: true,
                      imageFileId: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          product: {
            createdAt: "desc",
          },
        },
      },
    },
  });

  if (!collection) {
    return null;
  }

  const parentSummary = collection.parent
    ? {
        id: collection.parent.id,
        name: collection.parent.name,
        slug: collection.parent.slug,
      }
    : null;

  const baseCollection = mapCollectionFromRaw(
    {
      id: collection.id,
      name: collection.name,
      slug: collection.slug,
      description: collection.description,
      imageUrl: collection.imageUrl,
      imageFileId: collection.imageFileId,
      parent: parentSummary,
      _count: {
        products: collection.products.length,
      },
    },
    { productCount: collection.products.length },
  );

  const children = collection.children.map((child) =>
    mapCollectionFromRaw(
      {
        ...child,
        parent: {
          id: collection.id,
          name: collection.name,
          slug: collection.slug,
        },
      },
      { productCount: child._count?.products },
    ),
  );

  const collectionProductIds = collection.products.map((pivot) => pivot.product.id);
  const ratingSummaryMap = await buildRatingSummaryMap(collectionProductIds);

  const products = collection.products.map((pivot) =>
    mapProductFromRaw(pivot.product, ratingSummaryMap[pivot.product.id]),
  );

  return {
    collection: baseCollection,
    children,
    products,
  };
};

const isPrismaInitializationError = (error: unknown): error is Prisma.PrismaClientInitializationError => {
  return error instanceof Prisma.PrismaClientInitializationError;
};

export const getStorefrontProductBySlug = async (slug: string) => {
  let product;

  try {
    product = await prisma.product.findUnique({
      where: { slug, isPublished: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        compareAtPrice: true,
        mediaUrls: true,
        mediaFileIds: true,
        sku: true,
        stock: true,
        createdAt: true,
        collections: {
          where: { collection: { isPublished: true } },
          select: {
            collection: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                imageUrl: true,
                imageFileId: true,
              },
            },
          },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            title: true,
            comment: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
  } catch (error) {
    if (isPrismaInitializationError(error)) {
      console.error("[storefront] Prisma initialization error", error);
      return null;
    }

    throw error;
  }

  if (!product) {
    return null;
  }

  const { reviews, ...productData } = product;
  const [ratingSummaryMap, distributionRows] = await Promise.all([
    buildRatingSummaryMap([productData.id]),
    prisma.review.groupBy({
      by: ["rating"],
      where: { productId: productData.id },
      _count: { rating: true },
    }),
  ]);
  const ratingSummary = ratingSummaryMap[productData.id] ?? {
    averageRating: null,
    reviewCount: 0,
  };

  const mappedProduct = mapProductFromRaw(productData, ratingSummary);
  const normalizedReviews = reviews.map((review) => ({
    ...review,
    user: review.user ?? null,
  }));

  const distribution = Array.from({ length: 5 }).map((_, index) => {
    const ratingValue = 5 - index;
    const entry = distributionRows.find((row) => row.rating === ratingValue);
    const count = entry?._count.rating ?? 0;
    const percentage = ratingSummary.reviewCount > 0
      ? Math.round((count / ratingSummary.reviewCount) * 100)
      : 0;

    return {
      rating: ratingValue,
      count,
      percentage,
    } satisfies {
      rating: number;
      count: number;
      percentage: number;
    };
  });

  return {
    product: mappedProduct,
    reviews: normalizedReviews,
    averageRating: ratingSummary.averageRating,
    reviewCount: ratingSummary.reviewCount,
    distribution,
  } satisfies {
    product: StorefrontProduct;
    reviews: StorefrontReview[];
    averageRating: number | null;
    reviewCount: number;
    distribution: Array<{
      rating: number;
      count: number;
      percentage: number;
    }>;
  };
};

export const getFeaturedProducts = async ({ limit = 8 }: { limit?: number } = {}) => {
  const products = await prisma.product.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      compareAtPrice: true,
      mediaUrls: true,
      mediaFileIds: true,
      sku: true,
      stock: true,
      createdAt: true,
      collections: {
        where: { collection: { isPublished: true } },
        select: {
          collection: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              imageUrl: true,
              imageFileId: true,
            },
          },
        },
      },
    },
  });

  const featuredProductIds = products.map((product) => product.id);
  const ratingSummaryMap = await buildRatingSummaryMap(featuredProductIds);

  return products.map((product) => mapProductFromRaw(product, ratingSummaryMap[product.id]));
};

export type { StorefrontCollection, StorefrontProduct, StorefrontImage, StorefrontReview };
