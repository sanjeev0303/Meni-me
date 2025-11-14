'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface WishlistItemCardProps {
  id: string;
  productId: string;
  productName: string;
  price: number;
  image: string;
  slug: string;
}

export function WishlistItemCard({
  id,
  productId,
  productName,
  price,
  image,
  slug,
}: WishlistItemCardProps) {
  const queryClient = useQueryClient();

  const removeFromWishlistMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/storefront/wishlist/items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      if (!response.ok) throw new Error('Failed to remove from wishlist');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['commerce-counts'] });
    },
  });

  const moveToCartMutation = useMutation({
    mutationFn: async () => {
      // Add to cart
      const cartResponse = await fetch('/api/storefront/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (!cartResponse.ok) throw new Error('Failed to add to cart');

      // Remove from wishlist
      const wishlistResponse = await fetch('/api/storefront/wishlist/items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      if (!wishlistResponse.ok) throw new Error('Failed to remove from wishlist');
      return wishlistResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['user-cart'] });
      queryClient.invalidateQueries({ queryKey: ['commerce-counts'] });
    },
  });

  const handleRemoveFromWishlist = async () => {
    await removeFromWishlistMutation.mutateAsync();
  };

  const handleMoveToCart = async () => {
    await moveToCartMutation.mutateAsync();
  };

  const isLoading = removeFromWishlistMutation.isPending || moveToCartMutation.isPending;
  const FALLBACK_GRADIENT = 'bg-linear-to-br from-slate-200 via-slate-100 to-slate-300';

  return (
    <article
      className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
      data-wishlist-item-id={id}
    >
      <div className="relative aspect-4/5 overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={productName}
            fill
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, 30vw"
            className="object-cover"
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center ${FALLBACK_GRADIENT}`}>
            <span className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
              Meni-me
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{productName}</h2>
        </div>
        <p className="text-base font-semibold text-slate-900">₹{price.toLocaleString()}</p>
        <div className="mt-auto grid gap-3 sm:grid-cols-2">
          <Button asChild className="rounded-full">
            <Link href={`/products/${slug}`}>View details</Link>
          </Button>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={handleMoveToCart}
            disabled={isLoading}
            title="Move to bag"
            data-loader-skip
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Move to bag
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full w-full"
          onClick={handleRemoveFromWishlist}
          disabled={isLoading}
          title="Remove from wishlist"
          data-loader-skip
        >
          <Heart className="h-4 w-4 mr-2 fill-red-500 text-red-500" />
          Remove from wishlist
        </Button>
      </div>
    </article>
  );
}
