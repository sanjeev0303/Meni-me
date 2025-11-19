"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";

import { commerceCountsQueryKey } from "@/lib/query-keys";
import { useSession } from "@/lib/auth-client";
import type { UserWishlistData } from "@/server/storefront-service";
import { useToast } from "@/components/providers/toast-provider";

export type CollectionGridProduct = {
  id: string;
  slug: string;
  title: string;
  originalPrice: number;
  salePrice: number;
  discount?: string | null;
  image?: string | null;
  colors?: string[];
  category?: string;
  createdAt?: string;
};

type ProductGridProps = {
  products: CollectionGridProduct[];
  collectionName?: string;
};

class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export function ProductGrid({ products, collectionName }: ProductGridProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const isAuthenticated = Boolean(session?.user);

  const { data: wishlistData } = useQuery<UserWishlistData | null>({
    queryKey: ["user-wishlist"],
    queryFn: async () => {
      const response = await fetch("/api/storefront/wishlist", {
        method: "GET",
        cache: "no-store",
      });

      if (response.status === 401) {
        return null;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch wishlist");
      }

      return (await response.json()) as UserWishlistData;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
    retry: false,
  });

  const baseWishlistSet = useMemo(() => {
    if (!isAuthenticated || !wishlistData) {
      return new Set<string>();
    }

    return new Set(wishlistData.items.map((item) => item.productId));
  }, [isAuthenticated, wishlistData]);

  const [optimisticWishlist, setOptimisticWishlist] = useState<Record<string, boolean>>({});

  const wishlistSet = useMemo(() => {
    if (!isAuthenticated) {
      return new Set<string>();
    }

    const combined = new Set(baseWishlistSet);

    for (const [productId, value] of Object.entries(optimisticWishlist)) {
      if (value) {
        combined.add(productId);
      } else {
        combined.delete(productId);
      }
    }

    return combined;
  }, [baseWishlistSet, optimisticWishlist, isAuthenticated]);

  const wishlistMutation = useMutation<
    unknown,
    Error,
    { productId: string; action: "add" | "remove"; productTitle: string },
    { previousOptimistic: Record<string, boolean> }
  >({
    mutationFn: async ({ productId, action }) => {
      const response = await fetch("/api/storefront/wishlist/items", {
        method: action === "add" ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (response.status === 401) {
        throw new UnauthorizedError("Please sign in to manage your wishlist.");
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message =
          typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Unable to update wishlist. Please try again.";
        throw new Error(message);
      }

      return response.json();
    },
    onMutate: async ({ productId, action }) => {
      await queryClient.cancelQueries({ queryKey: ["user-wishlist"] });

      const previousOptimistic = { ...optimisticWishlist };

      setOptimisticWishlist((prev) => ({
        ...prev,
        [productId]: action === "add",
      }));

      return { previousOptimistic };
    },
  onError: (error, _variables, context) => {
      if (context?.previousOptimistic) {
        setOptimisticWishlist(context.previousOptimistic);
      }

      if (error instanceof UnauthorizedError) {
        addToast({
          title: "Sign in required",
          description: "Please sign in to manage your wishlist.",
          variant: "info",
        });
        const callbackUrl = pathname
          ? `?callbackUrl=${encodeURIComponent(pathname)}`
          : "";
        router.push(`/sign-in${callbackUrl}`);
        return;
      }

      console.error(
        "[wishlist] Failed to update product wishlist state",
        error
      );

      addToast({
        title: "We couldn’t update your wishlist",
        description:
          error instanceof Error && error.message
            ? error.message
            : "Please try again in a moment.",
        variant: "error",
      });
    },
    onSuccess: async (_data, variables) => {
      if (variables) {
        addToast({
          title:
            variables.action === "add"
              ? `${variables.productTitle} was added to your wishlist`
              : `${variables.productTitle} was removed from your wishlist`,
          variant: "success",
        });
      }

      const invalidateCounts = queryClient.invalidateQueries({ queryKey: commerceCountsQueryKey });
      const invalidateWishlist = queryClient.invalidateQueries({ queryKey: ["user-wishlist"] });

      await Promise.all([invalidateCounts, invalidateWishlist]);

      setOptimisticWishlist((prev) => {
        const next = { ...prev };
        if (variables?.productId) {
          delete next[variables.productId];
        }
        return next;
      });
    },
  });

  const handleWishlistToggle = (productId: string, isSaved: boolean) => {
    const action = isSaved ? "remove" : "add";
    const productTitle = products.find((item) => item.id === productId)?.title ?? "Product";
    wishlistMutation.mutate({ productId, action, productTitle });
  };

  const pendingProductId = wishlistMutation.isPending
    ? wishlistMutation.variables?.productId ?? null
    : null;

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      black: 'bg-black',
      blue: 'bg-blue-600',
      navy: 'bg-blue-900',
      gray: 'bg-gray-500',
      lightBlue: 'bg-blue-300',
      white: 'bg-white border border-gray-300',
      red: 'bg-red-600',
      green: 'bg-green-600',
      brown: 'bg-amber-900',
      charcoal: 'bg-gray-700'
    };
    return colorMap[color] || 'bg-gray-400';
  };

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="max-w-md text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-900">
              No products found
            </h3>
            {collectionName && (
              <p className="text-sm text-gray-600">
                We couldn't find any products in <span className="font-semibold">{collectionName}</span>
              </p>
            )}
            <p className="text-sm text-gray-500">
              Try adjusting your filters or check back later for new arrivals.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-gray-900 text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map(product => {
        const wishlistActive = wishlistSet.has(product.id);
        const isUpdatingThisProduct = pendingProductId === product.id;
        const salePrice = product.salePrice.toLocaleString("en-IN");
        const originalPrice = product.originalPrice.toLocaleString("en-IN");

        return (
          <Link key={product.id} href={`/products/${product.slug}`} className="group cursor-pointer" prefetch={false}>
            <div className="relative mb-3 bg-gray-100 rounded-lg overflow-hidden aspect-3/4 md:aspect-2/3">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  sizes="(max-width: 640px) 48vw, (max-width: 1024px) 50vw, 50vw"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                  {product.title.slice(0, 6)}
                </div>
              )}
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  if (!isUpdatingThisProduct) {
                    handleWishlistToggle(product.id, wishlistActive);
                  }
                }}
                className={`absolute top-2 right-2 p-2 rounded-full transition disabled:cursor-not-allowed disabled:opacity-70 ${
                  wishlistActive
                    ? "bg-red-600 text-white"
                    : "bg-white/80 hover:bg-white text-gray-900"
                }`}
                disabled={isUpdatingThisProduct}
                aria-pressed={wishlistActive}
                aria-label={
                  wishlistActive
                    ? `Remove ${product.title} from wishlist`
                    : `Add ${product.title} to wishlist`
                }
              >
                <Heart size={18} fill={wishlistActive ? "currentColor" : "none"} />
              </button>
              {product.discount && (
                <span className="absolute bottom-2 left-2 bg-white text-xs font-bold text-red-600 px-2 py-1 rounded">
                  {product.discount}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs md:text-sm text-gray-600 line-clamp-2 min-h-8">{product.title}</p>

              <div className="flex items-center gap-2">
                <p className="text-xs md:text-sm font-bold text-gray-900">₹{salePrice}</p>
                <p className="text-xs text-gray-500 line-through">₹{originalPrice}</p>
              </div>

              {/* Color swatches */}
              <div className="flex gap-1">
                {(product.colors ?? []).slice(0, 3).map((color, idx) => (
                  <div
                    key={`${product.id}-${color}-${idx}`}
                    className={`w-3 h-3 rounded-full ${getColorClass(color)}`}
                    title={color}
                  />
                ))}
                {product.colors && product.colors.length > 3 && (
                  <span className="text-xs text-gray-600 ml-1">+{product.colors.length - 3}</span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
