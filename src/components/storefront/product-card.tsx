"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StorefrontProduct } from "@/lib/storefront/catalog";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import RatingStars from "@/components/ui/rating-stars";

const getPrimaryImage = (product: StorefrontProduct) => {
  if (product.media.length > 0) {
    return product.media[0];
  }

  const collectionWithImage = product.collections.find((collection) => collection.image !== null);

  return collectionWithImage?.image ?? null;
};

type StorefrontProductCardProps = {
  product: StorefrontProduct;
  className?: string;
};

const StorefrontProductCard = ({ product, className }: StorefrontProductCardProps) => {
  const image = getPrimaryImage(product);
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/storefront/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add to cart");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-cart"] });
      queryClient.invalidateQueries({ queryKey: ["commerce-counts"] });
      setIsAdding(false);
    },
    onError: () => {
      setIsAdding(false);
    },
  });

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAdding(true);
    await addToCartMutation.mutateAsync();
  };

  const handleCheckout = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      await addToCartMutation.mutateAsync();
      router.push("/checkout");
    } catch {
      setIsAdding(false);
    }
  };

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md",
        className,
      )}
    >
  <Link href={`/products/${product.slug}`} className="relative block aspect-3/4 overflow-hidden">
        {image ? (
          <Image
            src={image.url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 40vw, 22vw"
            className="object-cover transition duration-700 group-hover:scale-105"
            priority={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-slate-200 via-slate-100 to-slate-300">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              Meni-me
            </span>
          </div>
        )}
        {hasDiscount ? (
          <span className="absolute left-4 top-4 rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white">
            Sale
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <Link href={`/products/${product.slug}`} className="text-lg font-semibold text-slate-900">
            {product.name}
          </Link>
          {product.collections.length ? (
            <p className="mt-1 text-xs uppercase tracking-[0.3em] text-slate-400">
              {product.collections.map((collection) => collection.name).join(" · ")}
            </p>
          ) : null}
          {product.reviewCount > 0 ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
              <RatingStars rating={product.averageRating ?? 0} size="sm" />
              <span className="font-medium text-slate-900">
                {product.averageRating?.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400">
                ({product.reviewCount})
              </span>
            </div>
          ) : (
            <p className="mt-3 text-xs uppercase tracking-[0.3em] text-emerald-400">Fresh release</p>
          )}
        </div>

        <div className="flex items-baseline gap-2 text-lg font-semibold text-slate-900">
          <span>{formatCurrency(product.price)}</span>
          {hasDiscount && product.compareAtPrice ? (
            <span className="text-sm font-medium text-slate-400 line-through">
              {formatCurrency(product.compareAtPrice)}
            </span>
          ) : null}
        </div>

        <div className="mt-auto space-y-2">
          <Button
            onClick={handleAddToCart}
            disabled={isAdding}
            className="w-full rounded-full"
            variant="outline"
            data-loader-skip
          >
            {isAdding ? "Adding..." : "Add to cart"}
          </Button>
          <Button
            onClick={handleCheckout}
            disabled={isAdding}
            className="w-full rounded-full"
            data-loader-skip
          >
            {isAdding ? "Processing..." : "Buy now"}
          </Button>
          <Button asChild variant="ghost" className="w-full rounded-full">
            <Link href={`/products/${product.slug}`}>View details</Link>
          </Button>
        </div>
      </div>
    </article>
  );
};

export default StorefrontProductCard;
