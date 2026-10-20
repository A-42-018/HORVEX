import { Link } from "react-router";
import { Badge } from "../../../components/common";
import { formatDateTime, formatPhone, formatTaka } from "../../../lib/format";
import { strings } from "../../../lib/strings";

const t = strings.admin.orders;
const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus";
const STATUS_BADGE = {
  pending: "limited",
  confirmed: "new",
  packed: "new",
  shipped: "new",
  delivered: "success",
  cancelled: "sale",
  returned: "soldOut",
};

export function StatusBadge({ status }) {
  return <Badge variant={STATUS_BADGE[status] ?? "neutral"}>{t.tabs[status] ?? status}</Badge>;
}

function OrderLink({ order }) {
  return (
    <Link
      to={`/admin/orders/${order.id}`}
      aria-label={t.table.open(order.order_number)}
      className={`rounded-control text-small font-semibold tabular-nums text-fg hover:text-brand ${focusRing}`}
    >
      {order.order_number}
    </Link>
  );
}

function PhoneLink({ order }) {
  return (
    <a
      href={`tel:${order.phone}`}
      aria-label={t.table.call(order.customer_name)}
      className={`inline-flex min-h-11 items-center rounded-control text-small tabular-nums text-muted hover:text-brand ${focusRing}`}
    >
      {formatPhone(order.phone)}
    </a>
  );
}

const courierText = (order) => (order.courier ? t.table.courier(order.courier, order.tracking_id) : null);

/** md+: a real table with one row per order. */
export function OrderTable({ orders }) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[46rem] border-collapse text-left">
        <caption className="sr-only">{t.table.caption}</caption>
        <thead>
          <tr className="border-b border-line text-badge text-muted">
            <th scope="col" className="px-4 py-3 font-semibold">{t.table.order}</th>
            <th scope="col" className="px-3 py-3 font-semibold">{t.table.customer}</th>
            <th scope="col" className="px-3 py-3 font-semibold">{t.table.district}</th>
            <th scope="col" className="px-3 py-3 text-right font-semibold">{t.table.total}</th>
            <th scope="col" className="px-4 py-3 font-semibold">{t.table.status}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="px-4 py-2 align-middle">
                <OrderLink order={order} />
                <p className="text-small text-muted">{formatDateTime(order.created_at)}</p>
              </td>
              <td className="max-w-[14rem] px-3 py-2 align-middle">
                <p className="truncate text-small font-semibold text-fg">{order.customer_name}</p>
                <PhoneLink order={order} />
              </td>
              <td className="px-3 py-2 align-middle text-small text-fg">{order.district}</td>
              <td className="px-3 py-2 text-right align-middle">
                <span className="block text-small font-semibold tabular-nums text-fg">{formatTaka(order.total)}</span>
                <span className="block text-small text-muted">{t.table.items(order.itemCount)}</span>
              </td>
              <td className="px-4 py-2 align-middle">
                <StatusBadge status={order.status} />
                {courierText(order) && <p className="mt-1 truncate text-small text-muted">{courierText(order)}</p>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Below md: one card per order. */
export function OrderCards({ orders }) {
  return (
    <ul className="divide-y divide-line md:hidden">
      {orders.map((order) => (
        <li key={order.id} className="flex flex-col gap-1 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <OrderLink order={order} />
            <StatusBadge status={order.status} />
          </div>
          <p className="text-small text-muted">{formatDateTime(order.created_at)}</p>
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-small font-semibold text-fg">{order.customer_name}</p>
            <span className="shrink-0 text-small font-semibold tabular-nums text-fg">{formatTaka(order.total)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <PhoneLink order={order} />
            <span className="text-small text-muted">
              {order.district} · {t.table.items(order.itemCount)}
            </span>
          </div>
          {courierText(order) && <p className="truncate text-small text-muted">{courierText(order)}</p>}
        </li>
      ))}
    </ul>
  );
}
