'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserOrderData } from '@/server/order-service';

interface OrderCardProps {
  order: UserOrderData;
}

const FALLBACK_GRADIENT = 'bg-linear-to-br from-slate-200 via-slate-100 to-slate-300';

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'PROCESSING':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'SHIPPED':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'DELIVERED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'CANCELLED':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case 'PAID':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'PENDING':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'FAILED':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

export function OrderCard({ order }: OrderCardProps) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const formattedTotal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: order.currency || 'INR',
  }).format(order.total);

  return (
    <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <CardHeader className="border-b border-slate-100 pb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg font-semibold text-slate-900">
                Order {order.orderNumber}
              </CardTitle>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] border ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] border ${getPaymentStatusColor(order.paymentStatus)}`}>
                {order.paymentStatus}
              </span>
            </div>
            <CardDescription className="text-slate-600">
              Placed on {formatDate(order.placedAt)} · {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-600">Total Amount</p>
            <p className="text-2xl font-semibold text-slate-900">{formattedTotal}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-4">
          {order.items && order.items.length > 0 ? (
            order.items.flatMap((item) =>
              Array.from({ length: item.quantity }, (_, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
                    {item.product?.mediaUrls && item.product.mediaUrls.length > 0 ? (
                      <Image
                        src={item.product.mediaUrls[0]}
                        alt={item.product?.name || 'Product'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className={`flex h-full w-full items-center justify-center ${FALLBACK_GRADIENT}`}>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-500">
                          Meni-me
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">{item.product?.name || item.productName}</h3>
                        <p className="text-sm text-slate-600">
                          Unit Price:{' '}
                          <span className="font-medium">
                            {new Intl.NumberFormat('en-IN', {
                              style: 'currency',
                              currency: order.currency || 'INR',
                            }).format(item.unitPrice)}
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-600">Price</p>
                        <p className="text-lg font-semibold text-slate-900">
                          {new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: order.currency || 'INR',
                          }).format(item.unitPrice)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )),
            )
          ) : (
            <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
              <p className="text-sm text-slate-500">No items in this order</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3 border-t border-slate-100 pt-6">
          <Button asChild variant="ghost" className="rounded-full">
            <Link href={`/orders/${order.id}`} prefetch>
              View details
            </Link>
          </Button>
          {order.items && order.items.length > 0 && order.items[0]?.product?.slug ? (
            <Button asChild variant="outline" className="rounded-full">
              <Link href={`/products/${order.items[0].product.slug}`}>
                Shop similar items
              </Link>
            </Button>
          ) : null}
          <Button asChild className="rounded-full">
            <Link href="/products">Continue shopping</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
