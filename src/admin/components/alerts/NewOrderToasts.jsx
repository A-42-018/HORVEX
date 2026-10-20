import { useEffect, useState } from "react";
import { Link } from "react-router";
import { BellRing, X } from "lucide-react";
import { IconButton } from "../../../components/common";
import { formatTaka } from "../../../lib/format";
import { strings } from "../../../lib/strings";
import { useOrderAlerts } from "../../../store/orderAlerts";

const t = strings.admin.alerts;
const DISMISS_MS = 15_000;
const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus";

function AlertCard({ alert, onDismiss }) {
  const [paused, setPaused] = useState(false);

  // Auto-dismiss, but never while the owner is hovering or focused inside the card.
  useEffect(() => {
    if (paused) return undefined;
    const timer = setTimeout(() => onDismiss(alert.id), DISMISS_MS);
    return () => clearTimeout(timer);
  }, [paused, alert.id, onDismiss]);

  return (
    <li
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="pointer-events-auto animate-fade-up rounded-card border border-brand bg-raised p-4 shadow-surface"
    >
      <div className="flex items-start gap-3">
        <BellRing aria-hidden="true" size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-brand" />
        <div className="min-w-0 flex-1">
          <p className="text-eyebrow text-brand">{t.newOrder}</p>
          <p className="mt-1 truncate text-small font-semibold text-fg">{alert.orderNumber}</p>
          <p className="truncate text-small text-muted">{t.summary(formatTaka(alert.total), alert.customerName)}</p>
          <Link
            to={`/admin/orders/${alert.id}`}
            onClick={() => onDismiss(alert.id)}
            className={`mt-2 inline-flex min-h-11 items-center text-small font-semibold text-brand underline underline-offset-4 ${focusRing}`}
          >
            {t.view}
          </Link>
        </div>
        <IconButton label={t.dismiss} variant="ghost" onClick={() => onDismiss(alert.id)} className="-mr-2 -mt-2">
          <X aria-hidden="true" size={20} strokeWidth={1.5} />
        </IconButton>
      </div>
    </li>
  );
}

/**
 * Newest-first stack of new-order cards, under the topbar. The live region stays
 * mounted so screen readers announce each card as it arrives. It sits in the page
 * layer, so (like the storefront toaster) it can't show above an open drawer; the
 * badge and the tab title still update then.
 */
function NewOrderToasts() {
  const alerts = useOrderAlerts((state) => state.alerts);
  const dismiss = useOrderAlerts((state) => state.dismiss);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={t.region}
      className="pointer-events-none fixed inset-x-gutter top-16 z-40 sm:left-auto sm:w-96"
    >
      {alerts.length > 0 && (
        <ul className="flex flex-col gap-3">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onDismiss={dismiss} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default NewOrderToasts;
