import { getAdminReportSummary } from "@/lib/admin/report";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StatCard } from "../_components/stat-card";
import TrendChart from "../_components/trend-chart";
import PerformanceGraph from "../_components/performance-graph";
import { ArrowDownRight, ArrowUpRight, ShoppingBag, Users2 } from "lucide-react";
import Link from "next/link";

type AdminReportSummary = Awaited<ReturnType<typeof getAdminReportSummary>>;

const DashboardPage = async () => {
  const report: AdminReportSummary = await getAdminReportSummary();
  const { kpis, revenueTrend, topProducts, collectionPerformance, newCustomers, recentOrders, orderTotals } = report;
  const statusPriority = ["PENDING", "PROCESSING", "SHIPPED", "RETURNED", "CANCELLED"];
  const nonDeliveredOrders = recentOrders
    .filter((order) => order.status !== "DELIVERED")
    .sort((a, b) => {
      const aPriority = statusPriority.indexOf(a.status);
      const bPriority = statusPriority.indexOf(b.status);
      if (aPriority === -1 && bPriority === -1) return a.status.localeCompare(b.status);
      if (aPriority === -1) return 1;
      if (bPriority === -1) return -1;
      return aPriority - bPriority;
    });
  const statusSummary = nonDeliveredOrders.reduce<Record<string, number>>((acc, order) => {
    acc[order.status] = (acc[order.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-12">
  <section className="rounded-3xl border border-slate-900/10 bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-2xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Operations overview</p>
            <h1 className="mt-3 text-4xl font-semibold">Commerce Pulse</h1>
            <p className="mt-3 text-sm text-white/80">
              Track revenue, customer growth, and operational performance across your Hub Fashiion storefront.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/report"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-white hover:text-slate-900"
            >
              Download report
            </Link>
            <Link
              href="/admin/order"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-slate-900 transition hover:bg-slate-100"
            >
              Manage orders
            </Link>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Fulfillment rate</p>
            <p className="mt-2 text-2xl font-semibold">{formatPercent(kpis.fulfillmentRate)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Open orders</p>
            <p className="mt-2 text-2xl font-semibold">{formatNumber(kpis.pendingOrders)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Average basket</p>
            <p className="mt-2 text-2xl font-semibold">{formatCurrency(kpis.averageOrderValue)}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 2xl:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(kpis.totalRevenue)}
          change={`${formatPercent(kpis.fulfillmentRate)} fulfillment`}
          caption="All time store revenue"
        />
        <StatCard
          title="Orders"
          value={formatNumber(kpis.totalOrders)}
          change={`${formatNumber(kpis.pendingOrders)} open`}
          caption="Lifetime customer orders"
          icon={ShoppingBag}
          tone="success"
        />
        <StatCard
          title="Average Order Value"
          value={formatCurrency(kpis.averageOrderValue)}
          change={`${formatCurrency(kpis.totalRevenue / Math.max(kpis.totalOrders, 1))} avg`}
          caption="Per order"
          tone="warning"
        />
        <StatCard
          title="Abandoned carts"
          value={formatNumber(kpis.abandonedCarts)}
          change={`${formatPercent(kpis.fulfillmentRate)} fulfillment rate`}
          caption="Carts started without checkout"
          icon={Users2}
          tone="danger"
        />
      </section>

      <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6 rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Revenue momentum</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Trend & detailed graph</h2>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              {revenueTrend.length} month view
            </p>
          </div>
          <TrendChart data={revenueTrend} />
          <PerformanceGraph
            data={revenueTrend}
            title="Revenue graph"
            subtitle="Past 6 months"
          />
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm">
          <div className="flex h-full flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Order volume</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{formatNumber(orderTotals.quantity)}</p>
                <p className="text-sm text-slate-500">Items fulfilled this year</p>
              </div>
              <div className="flex flex-col gap-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                  <ArrowUpRight className="h-3.5 w-3.5" /> {formatPercent(kpis.fulfillmentRate)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-600">
                  <ArrowDownRight className="h-3.5 w-3.5" /> {kpis.cancelledOrders} cancelled
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Delivered</span>
                <span className="font-semibold text-slate-900">{formatNumber(kpis.fulfilledOrders)}</span>
              </div>
              <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="bg-slate-900"
                  style={{ width: `${Math.min(kpis.fulfillmentRate, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Pending</span>
                <span>{formatNumber(kpis.pendingOrders)}</span>
              </div>
            </div>
            <div className="flex flex-1 flex-col rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Active pipeline</p>
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  {nonDeliveredOrders.length} orders
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                {Object.keys(statusSummary).length === 0 ? (
                  <span className="text-slate-400">No outstanding statuses</span>
                ) : (
                  [...statusPriority, ...Object.keys(statusSummary).filter((status) => !statusPriority.includes(status))]
                    .filter((status) => statusSummary[status])
                    .map((status) => (
                      <span key={status} className="rounded-full border border-slate-200 px-3 py-1 text-slate-600">
                        {status} · {statusSummary[status]}
                      </span>
                    ))
                )}
              </div>
              <div className="mt-3 flex-1 space-y-3 overflow-y-auto pr-2 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300">
                {nonDeliveredOrders.length === 0 ? (
                  <p className="text-xs text-slate-500">No pending or exception orders — fulfillment is caught up.</p>
                ) : (
                  nonDeliveredOrders.map((order) => {
                    const badgeTone: Record<string, string> = {
                      PENDING: "bg-amber-100 text-amber-700",
                      PROCESSING: "bg-sky-100 text-sky-700",
                      CANCELLED: "bg-rose-100 text-rose-600",
                      RETURNED: "bg-indigo-100 text-indigo-700",
                    };
                    const badgeClass = badgeTone[order.status] ?? "bg-slate-200 text-slate-700";

                    return (
                      <div key={order.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/90 px-3 py-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">#{order.orderNumber}</p>
                          <p className="text-xs text-slate-500">{order.user?.name ?? "Guest"}</p>
                        </div>
                        <div className="text-right">
                          <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3em]", badgeClass)}>
                            {order.status}
                          </span>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(order.total)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Top performers</h2>
              <p className="text-sm text-slate-500">Products ranked by revenue contribution.</p>
            </div>
            <Link href="/admin/products" className="text-sm font-medium text-slate-600 underline">
              Manage inventory
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {topProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{product.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatNumber(product.quantitySold)} units · {formatCurrency(product.revenue)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase text-slate-500">Stock</p>
                  <p className="text-sm font-semibold text-slate-900">{product.stock}</p>
                </div>
              </div>
            ))}
            {topProducts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                No sales yet — start promoting your latest drops.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Collection mix</h2>
          <p className="text-sm text-slate-500">Demand split across merchandising collections.</p>
          <div className="mt-6 space-y-4">
            {collectionPerformance.map((collection) => (
              <div key={collection.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="h-10 w-10 rounded-full bg-slate-900/10 text-center text-sm font-semibold leading-10 text-slate-900">
                    {collection.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{collection.name}</p>
                    <p className="text-xs text-slate-500">{formatNumber(collection.quantitySold)} units</p>
                  </div>
                </div>
                <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-slate-900"
                    style={{ width: `${Math.min(100, collection.quantitySold)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[3fr_2fr]">
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent orders</h2>
            <Link href="/admin/order" className="text-sm font-medium text-slate-600 underline">
              View all
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.3em] text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap py-3 pr-4 font-medium text-slate-900">
                      #{order.orderNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-slate-900">{order.user?.name ?? "Guest"}</div>
                      <div className="text-xs text-slate-500">{order.user?.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-900/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
                        {order.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                      {formatCurrency(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentOrders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                No orders yet. Run a seasonal campaign to bring shoppers in.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Fresh customers</h2>
            <Link href="/admin/customer" className="text-sm font-medium text-slate-600 underline">
              Manage
            </Link>
          </div>
          <ul className="mt-4 space-y-4">
            {newCustomers.map((customer) => (
              <li key={customer.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{customer.name}</p>
                  <p className="text-xs text-slate-500">
                    Joined {customer.createdAt.toLocaleDateString()} · {customer.orderCount} orders
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {formatCurrency(customer.lifetimeValue)}
                </span>
              </li>
            ))}
            {newCustomers.length === 0 ? (
              <li className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                Grow your community with targeted marketing campaigns.
              </li>
            ) : null}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
