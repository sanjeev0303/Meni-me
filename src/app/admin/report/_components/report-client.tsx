"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { RefreshCcw } from "lucide-react";

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return res.json();
};

type KpiSummary = {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  fulfilledOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  fulfillmentRate: number;
  abandonedCarts: number;
};

type TrendPoint = {
  label: string;
  value: number;
};

type TopProduct = {
  id: string;
  name: string;
  quantitySold: number;
  revenue: number;
  stock: number;
  price: number;
};

type CollectionPerformance = {
  id: string;
  name: string;
  quantitySold: number;
};

type NewCustomer = {
  id: string;
  name: string | null;
  createdAt: string;
  lifetimeValue: number;
  orderCount: number;
};

type RecentOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  placedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

type OrderTotals = {
  quantity: number;
  revenue: number;
};

type ReportResponse = {
  kpis: KpiSummary;
  revenueTrend: TrendPoint[];
  topProducts: TopProduct[];
  collectionPerformance: CollectionPerformance[];
  newCustomers: NewCustomer[];
  recentOrders: RecentOrder[];
  orderTotals: OrderTotals;
};

type ReportClientProps = {
  initialReport?: ReportResponse;
};

const ReportClient = ({ initialReport }: ReportClientProps) => {
  const { data: report, isFetching, refetch } = useQuery({
    queryKey: ["admin", "report"],
    queryFn: () => fetcher<ReportResponse>("/api/admin/report"),
    initialData: initialReport,
  });

  const maxTrendValue = useMemo(() => {
    if (!report || report.revenueTrend.length === 0) return 0;
    return Math.max(...report.revenueTrend.map((point) => point.value));
  }, [report]);

  if (!report) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Unable to load report data right now.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Performance snapshot</h2>
          <p className="text-sm text-slate-500">
            Track revenue, customer behavior, and fulfillment health over the last period.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCcw className="mr-1 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Revenue</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">
            {formatCurrency(report.kpis.totalRevenue)}
          </p>
          <p className="text-sm text-slate-500">{formatNumber(report.kpis.totalOrders)} orders</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Average order value</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">
            {formatCurrency(report.kpis.averageOrderValue)}
          </p>
          <p className="text-sm text-slate-500">{formatNumber(report.kpis.fulfilledOrders)} fulfilled</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Fulfillment rate</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">
            {formatPercent(report.kpis.fulfillmentRate)}
          </p>
          <p className="text-sm text-slate-500">{formatNumber(report.kpis.pendingOrders)} pending</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Abandoned carts</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">
            {formatNumber(report.kpis.abandonedCarts)}
          </p>
          <p className="text-sm text-slate-500">{formatNumber(report.kpis.cancelledOrders)} cancelled</p>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              Revenue trend
            </h3>
            <p className="text-xs text-slate-400">Last {report.revenueTrend.length} months</p>
          </div>
          <div className="mt-6 space-y-4">
            {report.revenueTrend.length === 0 ? (
              <p className="text-sm text-slate-500">Not enough sales data yet.</p>
            ) : (
              report.revenueTrend.map((point) => {
                const pct = maxTrendValue > 0 ? Math.max((point.value / maxTrendValue) * 100, 6) : 6;
                return (
                  <div key={point.label}>
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>{point.label}</span>
                      <span className="font-medium text-slate-900">{formatCurrency(point.value)}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-slate-900"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
            Fulfillment mix
          </h3>
          <dl className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="flex justify-between">
              <dt>Fulfilled orders</dt>
              <dd>{formatNumber(report.kpis.fulfilledOrders)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Processing queue</dt>
              <dd>{formatNumber(report.kpis.pendingOrders)}</dd>
            </div>
            <div className="flex justify-between text-rose-500">
              <dt>Cancelled</dt>
              <dd>{formatNumber(report.kpis.cancelledOrders)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Units sold</dt>
              <dd>{formatNumber(report.orderTotals.quantity)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Revenue generated</dt>
              <dd>{formatCurrency(report.orderTotals.revenue)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
            Top products
          </h3>
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Revenue</th>
                  <th className="px-4 py-3">Sold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">
                      No sales recorded yet.
                    </td>
                  </tr>
                ) : (
                  report.topProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">{product.name}</p>
                        <p className="text-xs text-slate-500">{product.stock} in stock</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatCurrency(product.revenue)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatNumber(product.quantitySold)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
            Collection performance
          </h3>
          <div className="mt-4 space-y-4">
            {report.collectionPerformance.length === 0 ? (
              <p className="text-sm text-slate-500">No collection data yet.</p>
            ) : (
              report.collectionPerformance.map((collection) => (
                <div key={collection.id} className="flex items-center justify-between text-sm text-slate-600">
                  <p>{collection.name}</p>
                  <p className="font-semibold text-slate-900">{formatNumber(collection.quantitySold)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
            New customers
          </h3>
          <div className="mt-4 space-y-4">
            {report.newCustomers.length === 0 ? (
              <p className="text-sm text-slate-500">No new signups this period.</p>
            ) : (
              report.newCustomers.map((customer) => (
                <div key={customer.id} className="flex items-center justify-between text-sm text-slate-600">
                  <div>
                    <p className="font-semibold text-slate-900">{customer.name ?? "Unnamed"}</p>
                    <p className="text-xs text-slate-500">
                      Joined {new Date(customer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(customer.lifetimeValue)}
                    </p>
                    <p className="text-xs text-slate-500">{formatNumber(customer.orderCount)} orders</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
            Recent orders
          </h3>
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">
                      Orders will appear here once they arrive.
                    </td>
                  </tr>
                ) : (
                  report.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">{order.orderNumber}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(order.placedAt).toLocaleDateString()} • {order.status}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <p>{order.user.name ?? "Guest"}</p>
                        <p className="text-xs text-slate-500">{order.paymentStatus}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(order.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportClient;
export type { ReportResponse };
