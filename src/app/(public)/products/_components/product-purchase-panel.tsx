"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { commerceCountsQueryKey } from "@/lib/query-keys";

export type ProductPurchasePanelProps = {
  productId: string;
  productName: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  sku: string | null;
};

const ProductPurchasePanel = ({ productId, productName, price, compareAtPrice, stock, sku }: ProductPurchasePanelProps) => {
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"info" | "success" | "error">("info");

  const hasDiscount = typeof compareAtPrice === "number" && compareAtPrice > price;
  const total = useMemo(() => quantity * price, [quantity, price]);
  const isOutOfStock = stock <= 0;

  const handleQuantityChange = (value: number) => {
    if (Number.isNaN(value) || value < 1) {
      return;
    }

    if (stock > 0 && value > stock) {
      setQuantity(stock);
      return;
    }

    setQuantity(value);
  };

  const adjustQuantity = (delta: number) => {
    const next = quantity + delta;
    if (next < 1) {
      setQuantity(1);
      return;
    }

    if (stock > 0 && next > stock) {
      setQuantity(stock);
      return;
    }

    setQuantity(next);
  };

  const sendStorefrontRequest = async (url: string, body: Record<string, unknown>) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (response.status === 401) {
      throw new Error("Please sign in to continue.");
    }

    if (!response.ok) {
      const message =
        data && typeof (data as { error?: unknown }).error === "string"
          ? ((data as { error: string }).error)
          : "Something went wrong. Please try again.";
      throw new Error(message);
    }
  };

  const cartMutation = useMutation<void, Error, { quantity: number }>({
    mutationFn: async ({ quantity: selectedQuantity }) => {
      await sendStorefrontRequest("/api/storefront/cart/items", {
        productId,
        quantity: selectedQuantity,
      });
    },
    onMutate: () => {
      setStatusTone("info");
      setStatusMessage(null);
    },
    onSuccess: () => {
      setStatusTone("success");
      setStatusMessage(`${productName} is waiting in your bag.`);
      void queryClient.invalidateQueries({ queryKey: commerceCountsQueryKey });
    },
    onError: (error) => {
      setStatusTone("error");
      setStatusMessage(error.message || "Unable to add to bag. Please try again.");
    },
  });

  const wishlistMutation = useMutation<void, Error>({
    mutationFn: async () => {
      await sendStorefrontRequest("/api/storefront/wishlist/items", {
        productId,
      });
    },
    onMutate: () => {
      setStatusTone("info");
      setStatusMessage(null);
    },
    onSuccess: () => {
      setStatusTone("success");
      setStatusMessage(`${productName} is saved to your wishlist.`);
      void queryClient.invalidateQueries({ queryKey: commerceCountsQueryKey });
    },
    onError: (error) => {
      setStatusTone("error");
      setStatusMessage(error.message || "Unable to save to wishlist. Please try again.");
    },
  });

  const isCartProcessing = cartMutation.isPending;
  const isWishlistProcessing = wishlistMutation.isPending;

  const handleAddToBag = () => {
    cartMutation.mutate({ quantity });
  };

  const handleSaveToWishlist = () => {
    wishlistMutation.mutate();
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Pricing</p>
          <div className="mt-2 flex items-baseline gap-3 text-2xl font-semibold text-slate-900">
            <span>{formatCurrency(price)}</span>
            {hasDiscount && compareAtPrice ? (
              <span className="text-sm font-medium text-slate-400 line-through">
                {formatCurrency(compareAtPrice)}
              </span>
            ) : null}
          </div>
          {hasDiscount && compareAtPrice ? (
            <p className="text-xs text-rose-500">Limited-time pricing — don&apos;t miss out.</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Quantity</span>
            {stock > 0 ? <span>{stock} in stock</span> : <span className="text-rose-500">Sold out</span>}
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => adjustQuantity(-1)}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              −
            </Button>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              value={quantity}
              onChange={(event) => handleQuantityChange(Number.parseInt(event.target.value, 10))}
              className="w-16 text-center"
              aria-label="Selected quantity"
            />
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => adjustQuantity(1)}
              disabled={stock > 0 ? quantity >= stock : false}
              aria-label="Increase quantity"
            >
              +
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Styling notes (optional)</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Let us know if you have special requests or fit preferences."
            className={cn(
              "w-full resize-none rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-700 shadow-inner transition focus:border-slate-900 focus:bg-white focus:outline-none",
            )}
          />
        </div>

        {sku ? (
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">SKU · {sku}</p>
        ) : null}

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center justify-between text-sm text-slate-700">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-900">{formatCurrency(total)}</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Shipping and taxes calculated at checkout.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            className="rounded-full bg-slate-900 text-white hover:bg-slate-800"
            disabled={isOutOfStock || isCartProcessing}
            onClick={handleAddToBag}
            data-loader-skip
          >
            {isCartProcessing ? "Adding…" : "Add to bag"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={isWishlistProcessing}
            onClick={handleSaveToWishlist}
            data-loader-skip
          >
            {isWishlistProcessing ? "Saving…" : "Save to wishlist"}
          </Button>
        </div>

        {statusMessage ? (
          <p
            className={cn(
              "text-sm",
              statusTone === "success"
                ? "text-emerald-600"
                : statusTone === "error"
                  ? "text-rose-600"
                  : "text-slate-500",
            )}
            role="status"
            aria-live="polite"
          >
            {statusMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default ProductPurchasePanel;
