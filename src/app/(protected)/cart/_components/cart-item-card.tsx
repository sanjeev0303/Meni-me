'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Heart, Trash2 } from 'lucide-react';
import Image from 'next/image';

interface CartItemCardProps {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image: string;
}

export function CartItemCard({
  id,
  productId,
  productName,
  price,
  quantity,
  size,
  color,
  image,
}: CartItemCardProps) {
  const queryClient = useQueryClient();

  const removeItemMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/storefront/cart/items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      if (!response.ok) throw new Error('Failed to remove item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-cart'] });
      queryClient.invalidateQueries({ queryKey: ['commerce-counts'] });
    },
  });

  const moveToWishlistMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/storefront/wishlist/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      if (!response.ok) throw new Error('Failed to add to wishlist');

      // Remove from cart after adding to wishlist
      const removeResponse = await fetch('/api/storefront/cart/items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      if (!removeResponse.ok) throw new Error('Failed to remove from cart');
      return removeResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-cart'] });
      queryClient.invalidateQueries({ queryKey: ['commerce-counts'] });
    },
  });

  const handleRemove = async () => {
    await removeItemMutation.mutateAsync();
  };

  const handleMoveToWishlist = async () => {
    await moveToWishlistMutation.mutateAsync();
  };

  const isLoading = removeItemMutation.isPending || moveToWishlistMutation.isPending;

  return (
  <div className="flex gap-4 py-4 border-b" data-cart-item-id={id}>
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={image}
          alt={productName}
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>

      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{productName}</h3>
        <div className="mt-1 flex gap-4 text-sm text-gray-500">
          {size && <span>Size: {size}</span>}
          {color && <span>Color: {color}</span>}
          <span>Qty: {quantity}</span>
        </div>
        <p className="mt-2 font-semibold text-gray-900">₹{(price * quantity).toLocaleString()}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full"
          onClick={handleRemove}
          disabled={isLoading}
          title="Remove from cart"
          data-loader-skip
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full"
          onClick={handleMoveToWishlist}
          disabled={isLoading}
          title="Move to wishlist"
          data-loader-skip
        >
          <Heart className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
