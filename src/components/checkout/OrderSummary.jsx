import { useState } from "react";
import { ChevronDown } from "lucide-react";
import CouponField from "./CouponField";
import { FreeDeliveryBar } from "../cart/CartParts";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { formatTaka } from "../../lib/format";
import { strings } from "../../lib/strings";

const t = strings.checkout.summary;
const copy = strings.cart.page;

function Row({ label, children, strong = false }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={strong ? "text-body text-fg" : "text-small text-muted"}>{label}</dt>
      <dd className={`tabular-nums ${strong ? "text-price text-brand" : "text-small text-fg"}`}>{children}</dd>
    </div>
  );
}

/**
 * Checkout order summary: lines, coupon and server totals (roadmap §6.7).
 * Below lg it collapses behind "Show order summary (৳…)"; on lg it is always open.
 * `totals` comes from the page so the sticky confirm bar shows the same number.
 */
function OrderSummary({ lines, totals, coupon }) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [open, setOpen] = useState(false);
  const expanded = isDesktop || open;
  const { quote, estimate, discount, delivery, total, eta, problem, fetching } = totals;

  return (
    <aside aria-label={t.title} className="rounded-card border border-line bg-surface lg:sticky lg:top-28">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setOpen(!open)}
        className="flex min-h-14 w-full items-center justify-between gap-3 px-5 text-small text-fg focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus lg:hidden"
      >
        <span>{expanded ? t.hide(formatTaka(total)) : t.show(formatTaka(total))}</span>
        <ChevronDown
          size={18}
          strokeWidth={1.5}
          aria-hidden="true"
          className={`transition-transform duration-fast ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      <div hidden={!expanded} className="space-y-5 p-5 pt-2 sm:p-6 sm:pt-2 lg:pt-6">
        <h2 className="hidden text-h3 lg:block">{t.title}</h2>

        <ul aria-label={t.linesLabel} className="divide-y divide-line">
          {lines.map((line) => (
            <li key={line.key} className="flex gap-3 py-3 first:pt-0">
              <div className="h-16 w-12 shrink-0 overflow-hidden rounded-control bg-raised">
                {line.image && <img src={line.image} alt="" loading="lazy" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-small text-fg">{line.name}</p>
                <p className="text-small text-muted">
                  {[line.variantName, t.qty(line.qty)].filter(Boolean).join(" · ")}
                </p>
              </div>
              <p className="text-small tabular-nums text-fg">{formatTaka(line.price * line.qty)}</p>
            </li>
          ))}
        </ul>

        <FreeDeliveryBar amount={estimate - discount} className="!bg-raised" />

        <CouponField
          applied={coupon.applied}
          message={coupon.message}
          disabled={!totals.ready}
          onApply={coupon.onApply}
          onRemove={coupon.onRemove}
        />

        <dl className="space-y-3 border-t border-line pt-5" aria-busy={fetching || undefined}>
          <Row label={strings.cart.subtotal}>{formatTaka(quote?.subtotal ?? estimate)}</Row>
          {discount > 0 && <Row label={copy.discount}>−{formatTaka(discount)}</Row>}
          {delivery !== null && <Row label={copy.delivery}>{delivery === 0 ? copy.free : formatTaka(delivery)}</Row>}
          <Row label={copy.total} strong>
            {formatTaka(total)}
          </Row>
        </dl>

        <p className="sr-only" role="status">
          {fetching ? t.checking : ""}
        </p>
        {!quote && !problem && <p className="text-small text-muted">{copy.estimateNote}</p>}
        {eta && <p className="text-small text-muted">{copy.eta(eta)}</p>}
        {problem && (
          <p className="text-small text-danger" role="alert">
            {problem}
          </p>
        )}
      </div>
    </aside>
  );
}

export default OrderSummary;
