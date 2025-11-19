'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import type { UserOrderData } from '@/server/order-service';
import { Button } from '@/components/ui/button';
import { OrderCard } from './_components/order-card';

const OrderPage = () => {
  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ['user-orders'],
    queryFn: async () => {
      const response = await fetch('/api/storefront/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json() as Promise<{ orders: UserOrderData[] }>;
    },
  });

  const orders: UserOrderData[] = ordersResponse?.orders ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="mb-12 space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Order history</p>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">Track your drop</h1>
              <p className="max-w-2xl text-sm text-slate-600">
                Review recent Meni-me orders, track shipments, and revisit pieces you loved.
              </p>
            </div>
            <Link
              href="/wishlist"
              className="text-sm font-medium text-slate-900 underline-offset-4 hover:underline"
            >
              View saved pieces
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50">
            <p className="text-slate-500">Loading your orders...</p>
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-center">
            <h2 className="text-xl font-semibold text-slate-900">No orders yet</h2>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              You haven&apos;t placed any orders yet. Start exploring and building your look today.
            </p>
            <Button asChild className="mt-6 rounded-full">
              <Link href="/products">Shop now</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
};

export default OrderPage;
