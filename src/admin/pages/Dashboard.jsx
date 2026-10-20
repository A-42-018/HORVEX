import { lazy, Suspense } from "react";
import { Link } from "react-router";
import { RefreshCw } from "lucide-react";
import { Badge, Button, Card, Skeleton } from "../../components/common";
import { formatDateTime, formatTaka } from "../../lib/format";
import { strings } from "../strings";
import { useDashboard } from "../hooks/useDashboard";

const RevenueChart = lazy(() => import("../components/dashboard/RevenueChart"));

const t = strings.admin.dashboard;
const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus";
const rowLink = `flex min-h-11 items-center justify-between gap-3 rounded-control px-2 -mx-2 hover:bg-fg/5 ${focusRing}`;

const STATUS_VARIANT = { delivered: "success", cancelled: "sale", returned: "sale" };

function Kpi({ label, value, hint, to }) {
  const body = (
    <>
      <p className="text-badge text-muted">{label}</p>
      <p className="mt-2 text-h3 text-fg">{value}</p>
      {hint && <p className="mt-1 text-small text-muted">{hint}</p>}
    </>
  );
  return to ? (
    <Card as={Link} to={to} hoverable className={`block p-5 ${focusRing}`}>
      {body}
    </Card>
  ) : (
    <Card className="p-5">{body}</Card>
  );
}

function Panel({ title, hint, action, children, className = "" }) {
  return (
    <Card as="section" className={`p-5 ${className}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-body font-semibold text-fg">{title}</h2>
          {hint && <p className="text-small text-muted">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

const Empty = ({ children }) => <p className="py-4 text-small text-muted">{children}</p>;

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label={strings.admin.checking} className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-80" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

function Dashboard() {
  const { data, isPending, isError, isFetching, refetch } = useDashboard();

  const rate = data?.deliveredRate;
  const chartSummary = data ? t.chart.total(formatTaka(data.totals.revenue), data.totals.orders) : "";

  return (
    <div className="flex flex-col gap-6">
      <title>{`${t.title} | WRISTORY Admin`}</title>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h3 text-fg">{t.title}</h1>
        <div className="flex items-center gap-3">
          {data && (
            <p className="text-small text-muted">
              {t.updated} {formatDateTime(data.generatedAt)}
            </p>
          )}
          <Button variant="secondary" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2">
            <RefreshCw aria-hidden="true" size={16} strokeWidth={1.5} className={isFetching ? "animate-spin" : ""} />
            {t.refresh}
          </Button>
        </div>
      </div>

      {isPending && <DashboardSkeleton />}

      {isError && !data && (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-small text-danger">{t.error}</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            {t.retry}
          </Button>
        </div>
      )}

      {data && (
        <>
          {data.truncated && <p className="text-small text-warning">{t.truncated}</p>}

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi label={t.kpi.ordersToday} value={data.today.orders} />
            <Kpi label={t.kpi.revenueToday} value={formatTaka(data.today.revenue)} />
            <Kpi label={t.kpi.pending} value={data.pending} hint={t.kpi.pendingHint} to="/admin/orders" />
            <Kpi
              label={t.kpi.deliveredRate}
              value={rate.resolved ? `${Math.round((rate.delivered / rate.resolved) * 100)}%` : "—"}
              hint={rate.resolved ? t.kpi.deliveredHint(rate.delivered, rate.resolved) : t.kpi.none}
            />
          </div>

          <Panel title={t.chart.title} hint={`${chartSummary}. ${t.chart.note}`}>
            {data.totals.orders === 0 ? (
              <Empty>{t.chart.empty}</Empty>
            ) : (
              <Suspense fallback={<Skeleton className="h-60" />}>
                <RevenueChart series={data.series} summary={chartSummary} />
              </Suspense>
            )}
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title={t.top.title} hint={t.top.hint}>
              {data.topProducts.length === 0 ? (
                <Empty>{t.top.empty}</Empty>
              ) : (
                <ol className="flex flex-col divide-y divide-line">
                  {data.topProducts.map((product, index) => (
                    <li key={product.key} className="flex min-h-11 items-center justify-between gap-3 py-2 text-small">
                      <span className="flex min-w-0 items-center gap-3">
                        <span aria-hidden="true" className="w-4 text-muted">
                          {index + 1}
                        </span>
                        <span className="truncate text-fg">{product.name}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block font-semibold text-fg">{t.top.units(product.qty)}</span>
                        <span className="block text-muted">{formatTaka(product.revenue)}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>

            <Panel title={t.low.title} hint={t.low.hint}>
              {data.lowStock.items.length === 0 ? (
                <Empty>{t.low.empty}</Empty>
              ) : (
                <>
                  <ul className="flex flex-col divide-y divide-line">
                    {data.lowStock.items.map((item) => (
                      <li key={item.key} className="flex min-h-11 items-center justify-between gap-3 py-2 text-small">
                        <span className="min-w-0 truncate text-fg">
                          {item.name}
                          {item.variant && <span className="text-muted"> · {item.variant}</span>}
                        </span>
                        <span className={`shrink-0 font-semibold ${item.stock === 0 ? "text-danger" : "text-warning"}`}>
                          {item.stock === 0 ? t.low.out : t.low.left(item.stock)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {data.lowStock.total > data.lowStock.items.length && (
                    <p className="pt-2 text-small text-muted">{t.low.more(data.lowStock.total - data.lowStock.items.length)}</p>
                  )}
                </>
              )}
            </Panel>
          </div>

          <Panel
            title={t.latest.title}
            action={
              <Link to="/admin/orders" className={`text-small font-semibold text-brand ${focusRing}`}>
                {t.latest.viewAll}
              </Link>
            }
          >
            {data.latest.length === 0 ? (
              <Empty>{t.latest.empty}</Empty>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {data.latest.map((order) => (
                  <li key={order.id}>
                    <Link to={`/admin/orders/${order.id}`} className={rowLink}>
                      <span className="min-w-0">
                        <span className="block truncate text-small font-semibold text-fg">
                          {order.order_number} · {order.customer_name}
                        </span>
                        <span className="block text-small text-muted">{formatDateTime(order.created_at)}</span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-small font-semibold text-fg">{formatTaka(order.total)}</span>
                        <Badge variant={STATUS_VARIANT[order.status] ?? "neutral"}>{t.status[order.status]}</Badge>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}

export default Dashboard;
