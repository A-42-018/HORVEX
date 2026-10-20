import { strings } from "../../../lib/strings";

const t = strings.admin.alerts;

/** Red count pill for the Orders nav link. Renders nothing at 0. */
function AlertCount({ count, className = "" }) {
  if (count < 1) return null;
  return (
    <span
      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-pill bg-oxblood px-1.5 text-badge text-ivory ${className}`}
    >
      <span aria-hidden="true">{count > 99 ? "99+" : count}</span>
      <span className="sr-only">{t.badge(count)}</span>
    </span>
  );
}

export default AlertCount;
