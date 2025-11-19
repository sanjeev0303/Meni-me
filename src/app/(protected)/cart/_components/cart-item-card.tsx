'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/providers/toast-provider';
import { commerceCountsQueryKey } from '@/lib/query-keys';
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
  const { addToast } = useToast();

  const sendAuthorizedRequest = async (
    url: string,
    options: RequestInit,
    fallbackMessage: string,
  ) => {
    const response = await fetch(url, options);

    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (response.status === 401) {
      throw new Error('Please sign in to continue.');
    }

    if (!response.ok) {
      const message =
        data && typeof (data as { error?: unknown }).error === 'string'
          ? ((data as { error: string }).error)
          : fallbackMessage;
      throw new Error(message);
    }

    return data;
  };

  const removeItemMutation = useMutation<void, Error>({
    mutationFn: async () => {
      await sendAuthorizedRequest(
        '/api/storefront/cart/items',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        },
        'Unable to remove from bag. Please try again.',
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-cart'] });
      queryClient.invalidateQueries({ queryKey: commerceCountsQueryKey });
      addToast({
        title: 'Removed from bag',
        description: `${productName} was removed from your bag.`,
        variant: 'success',
      });
    },
    onError: (error) => {
      addToast({
        title: 'Could not remove item',
        description: error.message || 'Unable to remove from bag. Please try again.',
        variant: 'error',
      });
    },
  });

  const moveToWishlistMutation = useMutation<void, Error>({
    mutationFn: async () => {
      await sendAuthorizedRequest(
        '/api/storefront/wishlist/items',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        },
        'Unable to save to wishlist. Please try again.',
      );

      await sendAuthorizedRequest(
        '/api/storefront/cart/items',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        },
        'Unable to remove from bag after saving. Please try again.',
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-cart'] });
      queryClient.invalidateQueries({ queryKey: commerceCountsQueryKey });
      addToast({
        title: 'Moved to wishlist',
        description: `${productName} is saved for later.`,
        variant: 'success',
      });
    },
    onError: (error) => {
      addToast({
        title: 'Could not move to wishlist',
        description: error.message || 'Unable to move to wishlist. Please try again.',
        variant: 'error',
      });
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
