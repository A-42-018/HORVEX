import { Card, Skeleton } from "../../../components/common";
import { formatDateTime } from "../../../lib/format";
import { strings } from "../../strings";
import { actorOf } from "./orderStatus";

const t = strings.admin.orders.detail.history;
const label = (status) => strings.admin.orders.tabs[status] ?? status;

/** Newest first, one row per status change. Names of other admins aren't readable by staff, so they show as "Team member". */
function OrderHistory({ history, isPending, isError, userId }) {
  const rows = [...(history ?? [])].reverse();
  return (
    <Card as="section" aria-labelledby="order-history-title" className="flex flex-col gap-3 p-5">
      <h2 id="order-history-title" className="text-h3 text-fg">
        {t.title}
      </h2>
      {isPending && <Skeleton className="h-16" />}
      {isError && !history && (
        <p role="alert" className="text-small text-danger">
          {t.error}
        </p>
      )}
      {history && rows.length === 0 && <p className="text-small text-muted">{t.empty}</p>}
      {rows.length > 0 && (
        <ol className="flex flex-col divide-y divide-line">
          {rows.map((entry) => (
            <li key={entry.id} className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0">
              <p className="text-small font-semibold text-fg">
                {entry.from_status ? t.changed(label(entry.from_status), label(entry.to_status)) : t.placed}
              </p>
              <p className="text-small text-muted">
                {t.by[actorOf(entry, userId)]} · {formatDateTime(entry.created_at)}
              </p>
              {entry.note && <p className="text-small text-fg">{entry.note}</p>}
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

export default OrderHistory;
