import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";

export type UserCommerceCounts = {
  cartCount: number;
  wishlistCount: number;
};

export type ClearCartResult = {
  removedCount: number;
};

type CartItemRemovalDescriptor = {
  productId: string;
  selectedSize?: string | null;
  selectedColor?: string | null;
};

export type CartItemSnapshot = {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  selectedSize: string | null;
  selectedColor: string | null;
};

export type WishlistItemSnapshot = {
  id: string;
  wishlistId: string;
  productId: string;
  addedAt: Date;
  selectedSize: string | null;
  selectedColor: string | null;
};

export type UserCartData = {
  id: string;
  items: CartItemWithProduct[];
  updatedAt: Date;
};

export type CartItemWithProduct = {
  id: string;
  productId: string;
  quantity: number;
  addedAt: Date;
  selectedSize: string | null;
  selectedColor: string | null;
  product: {
    id: string;
    name: string;
    price: number;
    mediaUrls: string[];
    slug: string;
  };
};

export type UserWishlistData = {
  id: string;
  items: WishlistItemWithProduct[];
  updatedAt: Date;
};

export type WishlistItemWithProduct = {
  id: string;
  productId: string;
  addedAt: Date;
  selectedSize: string | null;
  selectedColor: string | null;
  product: {
    id: string;
    name: string;
    price: number;
    mediaUrls: string[];
    slug: string;
  };
};

const cartItemSelect = {
  id: true,
  cartId: true,
  productId: true,
  quantity: true,
  selectedSize: true,
  selectedColor: true,
  addedAt: true,
} as const;

const wishlistItemSelect = {
  id: true,
  wishlistId: true,
  productId: true,
  addedAt: true,
  selectedSize: true,
  selectedColor: true,
} as const;

export const getUserCommerceCounts = async (
  userId: string,
): Promise<UserCommerceCounts> => {
  if (!userId.trim()) {
    return { cartCount: 0, wishlistCount: 0 };
  }

  const [cartCount, wishlistCount] = await Promise.all([
    prisma.cartItem.count({
      where: { cart: { userId } },
    }),
    prisma.wishlistItem.count({
      where: { wishlist: { userId } },
    }),
  ]);

  return { cartCount, wishlistCount };
};

const normalizeQuantity = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 1;
  }

  const rounded = Math.floor(value);
  return rounded > 0 ? rounded : 1;
};

const normalizeSelectionValue = (value?: string | null): string => {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : "";
};

const denormalizeSelectionValue = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const addItemToCart = async (
  userId: string,
  productId: string,
  quantity = 1,
  options: { selectedSize?: string | null; selectedColor?: string | null } = {},
): Promise<CartItemSnapshot> => {
  if (!userId.trim()) {
    throw new Error("User id is required to add cart items.");
  }

  if (!productId.trim()) {
    throw new Error("Product id is required to add cart items.");
  }

  const normalizedQuantity = normalizeQuantity(quantity);
  const normalizedSize = normalizeSelectionValue(options.selectedSize);
  const normalizedColor = normalizeSelectionValue(options.selectedColor);

  const cart = await prisma.cart.upsert({
    where: { userId },
    update: { updatedAt: new Date() },
    create: { userId },
    select: { id: true },
  });

  const item = await prisma.cartItem.upsert({
    where: {
      cartId_productId_selectedSize_selectedColor: {
        cartId: cart.id,
        productId,
        selectedSize: normalizedSize,
        selectedColor: normalizedColor,
      },
    },
    update: {
      quantity: {
        increment: normalizedQuantity,
      },
      addedAt: new Date(),
  selectedSize: normalizedSize,
  selectedColor: normalizedColor,
    },
    create: {
      cartId: cart.id,
      productId,
      quantity: normalizedQuantity,
  selectedSize: normalizedSize,
  selectedColor: normalizedColor,
    },
    select: cartItemSelect,
  });

  return {
    ...item,
    selectedSize: denormalizeSelectionValue(item.selectedSize),
    selectedColor: denormalizeSelectionValue(item.selectedColor),
  };
};

export const addItemToWishlist = async (
  userId: string,
  productId: string,
  options: { selectedSize?: string | null; selectedColor?: string | null } = {},
): Promise<WishlistItemSnapshot> => {
  if (!userId.trim()) {
    throw new Error("User id is required to add wishlist items.");
  }

  if (!productId.trim()) {
    throw new Error("Product id is required to add wishlist items.");
  }

  const normalizedSize = normalizeSelectionValue(options.selectedSize);
  const normalizedColor = normalizeSelectionValue(options.selectedColor);

  const wishlist = await prisma.wishlist.upsert({
    where: { userId },
    update: { updatedAt: new Date() },
    create: { userId },
    select: { id: true },
  });

  const item = await prisma.wishlistItem.upsert({
    where: {
      wishlistId_productId_selectedSize_selectedColor: {
        wishlistId: wishlist.id,
        productId,
        selectedSize: normalizedSize,
        selectedColor: normalizedColor,
      },
    },
    update: {
      addedAt: new Date(),
      selectedSize: normalizedSize,
      selectedColor: normalizedColor,
    },
    create: {
      wishlistId: wishlist.id,
      productId,
      selectedSize: normalizedSize,
      selectedColor: normalizedColor,
    },
    select: wishlistItemSelect,
  });

  return {
    ...item,
    selectedSize: denormalizeSelectionValue(item.selectedSize),
    selectedColor: denormalizeSelectionValue(item.selectedColor),
  };
};

export const removeItemFromWishlist = async (
  userId: string,
  productId: string,
  options: { selectedSize?: string | null; selectedColor?: string | null } = {},
): Promise<ClearCartResult> => {
  if (!userId.trim()) {
    return { removedCount: 0 };
  }

  if (!productId.trim()) {
    return { removedCount: 0 };
  }

  const wishlist = await prisma.wishlist.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!wishlist) {
    return { removedCount: 0 };
  }

  const hasSizeFilter = Object.prototype.hasOwnProperty.call(options, "selectedSize");
  const hasColorFilter = Object.prototype.hasOwnProperty.call(options, "selectedColor");
  const normalizedSize = hasSizeFilter ? normalizeSelectionValue(options.selectedSize ?? null) : undefined;
  const normalizedColor = hasColorFilter ? normalizeSelectionValue(options.selectedColor ?? null) : undefined;

  const deleteResult = await prisma.wishlistItem.deleteMany({
    where: {
      wishlistId: wishlist.id,
      productId,
      ...(hasSizeFilter ? { selectedSize: normalizedSize } : {}),
      ...(hasColorFilter ? { selectedColor: normalizedColor } : {}),
    },
  });

  if (deleteResult.count > 0) {
    await prisma.wishlist.update({
      where: { id: wishlist.id },
      data: { updatedAt: new Date() },
    });
  }

  return { removedCount: deleteResult.count };
};

export const clearUserCart = async (
  userId: string,
  items?: Array<string | CartItemRemovalDescriptor> | null,
): Promise<ClearCartResult> => {
  if (!userId.trim()) {
    return { removedCount: 0 };
  }

  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!cart) {
    return { removedCount: 0 };
  }

  const removalItems = Array.isArray(items) ? items.filter((item) => item !== undefined && item !== null) : [];
  const hasProductFilter = removalItems.length > 0;

  const deleteResult = await prisma.cartItem.deleteMany({
    where: {
      cartId: cart.id,
      ...(hasProductFilter
        ? typeof removalItems[0] === "string"
          ? { productId: { in: removalItems as string[] } }
          : (() => {
              const variantConditions = (removalItems as CartItemRemovalDescriptor[])
                .map((descriptor) => {
                  if (!descriptor || typeof descriptor.productId !== "string") {
                    return null;
                  }

                  const condition: Record<string, unknown> = {
                    productId: descriptor.productId,
                  };

                  if (Object.prototype.hasOwnProperty.call(descriptor, "selectedSize")) {
                    condition.selectedSize = normalizeSelectionValue(descriptor.selectedSize ?? null);
                  }

                  if (Object.prototype.hasOwnProperty.call(descriptor, "selectedColor")) {
                    condition.selectedColor = normalizeSelectionValue(descriptor.selectedColor ?? null);
                  }

                  return condition;
                })
                .filter((entry): entry is Record<string, unknown> => entry !== null);

              return variantConditions.length > 0 ? { OR: variantConditions } : {};
            })()
        : {}),
    },
  });

  if (deleteResult.count > 0) {
    await prisma.cart.update({
      where: { id: cart.id },
      data: { updatedAt: new Date() },
    });
  }

  return { removedCount: deleteResult.count };
};

export const getUserCart = async (userId: string): Promise<UserCartData | null> => {
  if (!userId.trim()) {
    return null;
  }

  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: {
      id: true,
      updatedAt: true,
      items: {
        select: {
          id: true,
          productId: true,
          quantity: true,
          addedAt: true,
          selectedSize: true,
          selectedColor: true,
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              mediaUrls: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!cart) {
    return null;
  }

  return {
    id: cart.id,
    items: cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      addedAt: item.addedAt,
      selectedSize: denormalizeSelectionValue(item.selectedSize),
      selectedColor: denormalizeSelectionValue(item.selectedColor),
      product: {
        id: item.product.id,
        name: item.product.name,
        price: typeof item.product.price === 'number'
          ? item.product.price
          : parseFloat(item.product.price.toString()),
        mediaUrls: item.product.mediaUrls,
        slug: item.product.slug,
      },
    })),
    updatedAt: cart.updatedAt,
  };
};

export const getUserWishlist = async (userId: string): Promise<UserWishlistData | null> => {
  if (!userId.trim()) {
    return null;
  }

  const wishlist = await prisma.wishlist.findUnique({
    where: { userId },
    select: {
      id: true,
      updatedAt: true,
      items: {
        select: {
          id: true,
          productId: true,
          addedAt: true,
          selectedSize: true,
          selectedColor: true,
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              mediaUrls: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!wishlist) {
    return null;
  }

  return {
    id: wishlist.id,
    items: wishlist.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      addedAt: item.addedAt,
      selectedSize: denormalizeSelectionValue(item.selectedSize),
      selectedColor: denormalizeSelectionValue(item.selectedColor),
      product: {
        id: item.product.id,
        name: item.product.name,
        price: typeof item.product.price === 'number'
          ? item.product.price
          : parseFloat(item.product.price.toString()),
        mediaUrls: item.product.mediaUrls,
        slug: item.product.slug,
      },
    })),
    updatedAt: wishlist.updatedAt,
  };
};

export type ProductReviewRecord = {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
};

export type ProductReviewSummary = {
  averageRating: number | null;
  reviewCount: number;
};

export type ProductReviewDistributionEntry = {
  rating: number;
  count: number;
  percentage: number;
};

export type ProductReviewBundle = ProductReviewSummary & {
  reviews: ProductReviewRecord[];
  userReview: ProductReviewRecord | null;
  distribution: ProductReviewDistributionEntry[];
};

const mapProductReview = (review: {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    image: string | null;
  } | null;
}): ProductReviewRecord => {
  return {
    id: review.id,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    user: review.user ?? {
      id: "unknown",
      name: "Guest",
      image: null,
    },
  } satisfies ProductReviewRecord;
};

export const getProductReviewBundle = async (
  productId: string,
  options: {
    limit?: number;
    userId?: string;
  } = {},
): Promise<ProductReviewBundle> => {
  const trimmedProductId = productId.trim();

  if (!trimmedProductId) {
    return {
      averageRating: null,
      reviewCount: 0,
      reviews: [],
      userReview: null,
      distribution: Array.from({ length: 5 }).map((_, index) => ({
        rating: 5 - index,
        count: 0,
        percentage: 0,
      })),
    } satisfies ProductReviewBundle;
  }

  const limit = options.limit ?? 12;

  const [reviewRows, aggregate, userReviewRow, distributionRows] = await Promise.all([
    prisma.review.findMany({
      where: { productId: trimmedProductId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        rating: true,
        title: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    }),
    prisma.review.aggregate({
      where: { productId: trimmedProductId },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    options.userId
      ? prisma.review.findUnique({
          where: {
            userId_productId: {
              userId: options.userId,
              productId: trimmedProductId,
            },
          },
          select: {
            id: true,
            rating: true,
            title: true,
            comment: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        })
      : Promise.resolve(null),
    prisma.review.groupBy({
      by: ["rating"],
      where: { productId: trimmedProductId },
      _count: { rating: true },
    }),
  ]);

  const averageRatingRaw = aggregate._avg.rating;
  let averageRating: number | null = null;

  if (averageRatingRaw !== null) {
    const numericAverage = typeof averageRatingRaw === "number"
      ? averageRatingRaw
      : (averageRatingRaw as Prisma.Decimal).toNumber();

    averageRating = Number.isFinite(numericAverage) ? numericAverage : null;
  }

  const reviewCount = aggregate._count.rating ?? 0;
  const reviews = reviewRows.map((review) => mapProductReview(review));
  const userReview = userReviewRow ? mapProductReview(userReviewRow) : null;

  const distributionMap = new Map<number, number>();
  distributionRows.forEach((entry) => {
    distributionMap.set(entry.rating, entry._count.rating ?? 0);
  });

  const distribution = Array.from({ length: 5 }).map((_, index) => {
    const ratingValue = 5 - index;
    const count = distributionMap.get(ratingValue) ?? 0;
    const percentage = reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;

    return {
      rating: ratingValue,
      count,
      percentage,
    } satisfies ProductReviewDistributionEntry;
  });

  return {
    averageRating,
    reviewCount,
    reviews,
    userReview,
    distribution,
  } satisfies ProductReviewBundle;
};

export const upsertProductReview = async (
  input: {
    userId: string;
    productId: string;
    rating: number;
    title?: string | null;
    comment?: string | null;
  },
): Promise<ProductReviewBundle> => {
  const userId = input.userId.trim();
  const productId = input.productId.trim();

  if (!userId || !productId) {
    throw new Error("userId and productId are required to submit a review");
  }

  const sanitizedRating = Math.min(Math.max(Math.round(input.rating), 1), 5);
  const title = input.title?.trim() ?? null;
  const comment = input.comment?.trim() ?? null;

  await prisma.review.upsert({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
    update: {
      rating: sanitizedRating,
      title,
      comment,
    },
    create: {
      userId,
      productId,
      rating: sanitizedRating,
      title,
      comment,
    },
  });

  return getProductReviewBundle(productId, { userId });
};
