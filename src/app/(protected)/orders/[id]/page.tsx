'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/providers/toast-provider';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { OrderDetailData } from '@/server/order-service';
import { OrderStatus } from '@/generated/prisma';

const CANCELLABLE_STATUSES: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.PROCESSING];

const formatDate = (date?: Date | string | null) => {
  if (!date) return null;
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  } catch {
    return null;
  }
};

const fetchOrderDetail = async (orderId: string): Promise<OrderDetailData> => {
  const response = await fetch(`/api/storefront/orders/${orderId}`);
  if (response.status === 404) {
    throw new Error('Order not found');
  }
  if (!response.ok) {
    throw new Error('Unable to load order. Please try again.');
  }
  const data = (await response.json()) as { order: OrderDetailData };
  return data.order;
};

const cancelOrderRequest = async (orderId: string): Promise<OrderDetailData> => {
  const response = await fetch(`/api/storefront/orders/${orderId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'cancel' }),
  });

  const payload = (await response.json().catch(() => null)) as { order?: OrderDetailData; error?: string } | null;

  if (!response.ok || !payload?.order) {
    throw new Error(payload?.error || 'Unable to cancel this order.');
  }

  return payload.order;
};

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Pending',
  [OrderStatus.PROCESSING]: 'Processing',
  [OrderStatus.SHIPPED]: 'Shipped',
  [OrderStatus.DELIVERED]: 'Delivered',
  [OrderStatus.CANCELLED]: 'Cancelled',
  [OrderStatus.RETURNED]: 'Returned',
};

type TimelineStep = {
  key: string;
  label: string;
  description: string;
  completed: boolean;
  isCurrent: boolean;
};

const buildTimeline = (order: OrderDetailData): TimelineStep[] => {
  if (order.status === OrderStatus.CANCELLED) {
    return [
      {
        key: 'cancelled',
        label: 'Order cancelled',
        description: formatDate(order.cancelledAt) || 'Cancellation confirmed',
        completed: true,
        isCurrent: true,
      },
    ];
  }

  const statusRank: OrderStatus[] = [
    OrderStatus.PENDING,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
  ];

  return statusRank.map((status) => {
    const idx = statusRank.indexOf(status);
    const currentIdx = statusRank.indexOf(order.status);
    const completed = currentIdx >= idx;
    const isCurrent = order.status === status;

    let description = 'Awaiting next milestone';
    if (status === OrderStatus.PENDING) {
      description = formatDate(order.placedAt) || 'Ordered';
    } else if (status === OrderStatus.SHIPPED && order.fulfilledAt) {
      description = formatDate(order.fulfilledAt) || 'Shipment confirmed';
    } else if (status === OrderStatus.DELIVERED && order.fulfilledAt) {
      description = formatDate(order.fulfilledAt) || 'Delivered';
    } else if (status === OrderStatus.PROCESSING && completed) {
      description = 'Preparing your pieces';
    }

    return {
      key: status,
      label: ORDER_STATUS_LABELS[status],
      description,
      completed,
      isCurrent,
    };
  });
};

const formatAddress = (address?: Record<string, unknown> | null) => {
  if (!address) return null;
  const parts: string[] = [];
  if (typeof address.fullName === 'string') parts.push(address.fullName);
  const line1 = typeof address.streetLine1 === 'string' ? address.streetLine1 : undefined;
  const line2 = typeof address.streetLine2 === 'string' ? address.streetLine2 : undefined;
  if (line1) parts.push(line1);
  if (line2) parts.push(line2);
  const city = typeof address.city === 'string' ? address.city : undefined;
  const state = typeof address.state === 'string' ? address.state : undefined;
  const postalCode = typeof address.postalCode === 'string' ? address.postalCode : undefined;
  const region = [city, state, postalCode].filter(Boolean).join(', ');
  if (region) parts.push(region);
  const country = typeof address.country === 'string' ? address.country : undefined;
  if (country) parts.push(country);
  if (typeof address.phoneNumber === 'string') {
    parts.push(`Phone: ${address.phoneNumber}`);
  }
  return parts;
};

const OrderDetailPage = () => {
  const params = useParams<{ id: string }>();
  const orderId = params?.id;
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const router = useRouter();

  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<OrderDetailData, Error>({
    queryKey: ['user-order', orderId],
    queryFn: () => {
      if (!orderId) {
        throw new Error('Missing order id');
      }
      return fetchOrderDetail(orderId);
    },
    retry: false,
    enabled: Boolean(orderId),
  });

  const cancelMutation = useMutation<OrderDetailData, Error, void>({
    mutationFn: () => {
      if (!orderId) {
        throw new Error('Missing order id');
      }
      return cancelOrderRequest(orderId);
    },
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(['user-order', orderId], updatedOrder);
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      addToast({
        title: 'Order cancelled',
        description: `${updatedOrder.orderNumber} has been cancelled.`,
        variant: 'success',
      });
    },
    onError: (mutationError) => {
      addToast({
        title: 'Unable to cancel order',
        description: mutationError.message,
        variant: 'error',
      });
    },
  });

  const canCancel = order ? CANCELLABLE_STATUSES.includes(order.status) : false;
  const canDownloadInvoice = order?.status === OrderStatus.DELIVERED;

  const addressLines = formatAddress(order?.shippingAddress);
  const timeline = order ? buildTimeline(order) : [];

  const subtotal = order ? formatCurrency(order.subtotal) : null;
  const total = order ? formatCurrency(order.total) : null;

  const statusBadgeClass = useMemo(() => {
    if (!order) return 'bg-slate-100 text-slate-700 border-slate-200';
    switch (order.status) {
      case OrderStatus.DELIVERED:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case OrderStatus.SHIPPED:
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case OrderStatus.PROCESSING:
      case OrderStatus.PENDING:
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case OrderStatus.CANCELLED:
        return 'bg-red-50 text-red-600 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }, [order]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-slate-500">Loading order details…</p>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <p className="text-lg font-semibold text-slate-900">{error?.message || 'Order unavailable'}</p>
        <p className="mt-2 text-sm text-slate-500">We couldn&apos;t load that order. Please return to your order history.</p>
        <Button asChild className="mt-6 rounded-full">
          <Link href="/orders">Back to orders</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="mx-auto w-full max-w-5xl px-6 py-12">
        <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Order detail</p>
            <h1 className="text-3xl font-semibold text-slate-900">Order {order.orderNumber}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className={cn('rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]', statusBadgeClass)}>
                {ORDER_STATUS_LABELS[order.status]}
              </span>
              <span>Placed {formatDate(order.placedAt)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/orders">Back to orders</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => refetch()}
              disabled={cancelMutation.isPending}
            >
              Refresh tracking
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={!canDownloadInvoice}
              onClick={() => {
                if (!canDownloadInvoice) return;
                const invoiceUrl = `/api/storefront/orders/${order.id}/invoice`;
                window.open(invoiceUrl, "_blank", "noopener,noreferrer");
              }}
            >
              {canDownloadInvoice ? "Download invoice" : "Invoice available after delivery"}
            </Button>
            <Button
              type="button"
              className="rounded-full bg-rose-600 text-white hover:bg-rose-500"
              disabled={!canCancel || cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              {canCancel ? (cancelMutation.isPending ? 'Cancelling…' : 'Cancel order') : 'Cancellation unavailable'}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Items</h2>
                <p className="text-sm text-slate-500">{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</p>
              </div>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">{item.product?.name || item.productName}</h3>
                        <p className="text-sm text-slate-600">Qty {item.quantity}</p>
                        <p className="text-sm text-slate-600">
                          {item.selectedSize ? `Size ${item.selectedSize} ` : ''}
                          {item.selectedColor ? `· Color ${item.selectedColor}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Line total</p>
                        <p className="text-lg font-semibold text-slate-900">{formatCurrency(item.lineTotal)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t border-slate-100 pt-4 text-sm text-slate-600">
                <div className="flex justify-between"><span>Subtotal</span><span>{subtotal}</span></div>
                <div className="flex justify-between font-semibold text-slate-900"><span>Total</span><span>{total}</span></div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Tracking</h2>
                <span className="text-sm text-slate-500">Stay updated on every milestone</span>
              </div>
              <ol className="space-y-4">
                {timeline.map((step, index) => (
                  <li key={step.key} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold uppercase tracking-[0.2em]',
                          step.completed ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-500',
                        )}
                      >
                        {index + 1}
                      </span>
                      {index !== timeline.length - 1 && (
                        <span className="mt-1 h-8 w-px bg-slate-200" aria-hidden="true" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{step.label}</p>
                      <p className="text-xs text-slate-500">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Shipping address</h2>
              {addressLines ? (
                <ul className="mt-4 space-y-1 text-sm text-slate-600">
                  {addressLines.map((entry, index) => (
                    <li key={`${entry}-${index}`}>{entry}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-slate-500">No shipping information on file.</p>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Need help?</h2>
              <p className="mt-2 text-sm text-slate-600">
                Contact our concierge team if you have any questions about this order. Share your order number {order.orderNumber} for faster support.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4 w-full rounded-full"
                onClick={() => router.push('/support')}
              >
                Message support
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OrderDetailPage;
