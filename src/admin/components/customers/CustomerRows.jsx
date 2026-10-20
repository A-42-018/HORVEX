import { Link } from "react-router";
import { Badge, Button } from "../../../components/common";
import { formatDate, formatPhone, formatTaka } from "../../../lib/format";
import { strings } from "../../../lib/strings";
import { deliveredShare, ordersLinkFor, riskLevel } from "./customerRules";

const t = strings.admin.customers;
const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus";

/** Blocked wins over the cancel-rate hint; nothing for a clean customer. */
export function CustomerBadge({ customer }) {
  if (customer.is_blocked) return <Badge variant="soldOut">{t.badge.blocked}</Badge>;
  const risk = riskLevel(customer);
  if (risk === "high") return <Badge variant="sale">{t.badge.high}</Badge>;
  if (risk === "watch") return <Badge variant="limited">{t.badge.watch}</Badge>;
  return null;
}

function Outcome({ customer }) {
  const share = deliveredShare(customer);
  return (
    <>
      <span className="block text-small text-fg">{t.table.ratio(customer.delivered_count, customer.cancelled_count)}</span>
      <span className="block text-small text-muted">{share == null ? t.table.noOutcome : t.table.share(share)}</span>
    </>
  );
}

function PhoneLink({ customer }) {
  return (
    <a
      href={`tel:${customer.phone}`}
      aria-label={t.table.call(customer.name)}
      className={`inline-flex min-h-11 items-center rounded-control text-small tabular-nums text-muted hover:text-brand ${focusRing}`}
    >
      {formatPhone(customer.phone)}
    </a>
  );
}

function Actions({ customer, onBlock, onUnblock }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        to={ordersLinkFor(customer.phone)}
        aria-label={t.table.viewOrdersFor(customer.name)}
        className={`inline-flex min-h-11 items-center rounded-control px-2 text-small font-semibold text-brand hover:underline ${focusRing}`}
      >
        {t.table.viewOrders}
      </Link>
      {customer.is_blocked ? (
        <Button variant="secondary" size="sm" onClick={() => onUnblock(customer)} aria-label={t.block.unblockFor(customer.name)}>
          {t.block.unblock}
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => onBlock(customer)} aria-label={t.block.buttonFor(customer.name)}>
          {t.block.button}
        </Button>
      )}
    </div>
  );
}

/** md+: a real table with one row per phone number. */
export function CustomerTable({ customers, onBlock, onUnblock }) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[56rem] border-collapse text-left">
        <caption className="sr-only">{t.table.caption}</caption>
        <thead>
          <tr className="border-b border-line text-badge text-muted">
            <th scope="col" className="px-4 py-3 font-semibold">{t.table.customer}</th>
            <th scope="col" className="px-3 py-3 font-semibold">{t.table.district}</th>
            <th scope="col" className="px-3 py-3 font-semibold">{t.table.orders}</th>
            <th scope="col" className="px-3 py-3 font-semibold">{t.table.outcome}</th>
            <th scope="col" className="px-3 py-3 text-right font-semibold">{t.table.spent}</th>
            <th scope="col" className="px-3 py-3 font-semibold">{t.table.last}</th>
            <th scope="col" className="px-4 py-3 font-semibold">{t.table.actions}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {customers.map((customer) => (
            <tr key={customer.phone}>
              <td className="max-w-[15rem] px-4 py-2 align-middle">
                <p className="truncate text-small font-semibold text-fg">{customer.name}</p>
                <PhoneLink customer={customer} />
                <div className="mt-0.5">
                  <CustomerBadge customer={customer} />
                </div>
              </td>
              <td className="px-3 py-2 align-middle text-small text-fg">{customer.district}</td>
              <td className="px-3 py-2 align-middle text-small tabular-nums text-fg">{customer.orders_count}</td>
              <td className="px-3 py-2 align-middle">
                <Outcome customer={customer} />
              </td>
              <td className="px-3 py-2 text-right align-middle text-small font-semibold tabular-nums text-fg">{formatTaka(customer.total_spent)}</td>
              <td className="px-3 py-2 align-middle text-small text-muted">{formatDate(customer.last_order_at)}</td>
              <td className="px-4 py-2 align-middle">
                <Actions customer={customer} onBlock={onBlock} onUnblock={onUnblock} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Below md: one card per customer. */
export function CustomerCards({ customers, onBlock, onUnblock }) {
  return (
    <ul className="divide-y divide-line md:hidden">
      {customers.map((customer) => (
        <li key={customer.phone} className="flex flex-col gap-1 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-small font-semibold text-fg">{customer.name}</p>
            <CustomerBadge customer={customer} />
          </div>
          <PhoneLink customer={customer} />
          <p className="text-small text-muted">
            {customer.district} · {t.table.ordersCount(customer.orders_count)} · {formatTaka(customer.total_spent)}
          </p>
          <div>
            <Outcome customer={customer} />
          </div>
          <p className="text-small text-muted">{`${t.table.last}: ${formatDate(customer.last_order_at)}`}</p>
          <Actions customer={customer} onBlock={onBlock} onUnblock={onUnblock} />
        </li>
      ))}
    </ul>
  );
}
