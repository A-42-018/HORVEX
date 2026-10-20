import { Check, X } from "lucide-react";
import { formatDateTime } from "../../lib/format";
import { strings } from "../../lib/strings";

const t = strings.trackOrder;
const STEPS = ["pending", "confirmed", "packed", "shipped", "delivered"];

/** First time each status was reached, from the server history. */
function reachedAt(history = []) {
  const map = {};
  for (const h of history) if (!map[h.status]) map[h.status] = h.at;
  return map;
}

/**
 * Placed → Confirmed → Packed → Shipped → Delivered (roadmap §6.8). A cancelled
 * or returned order keeps the steps it reached and ends on that state.
 */
function OrderTimeline({ status, history, children }) {
  const at = reachedAt(history);
  const stopped = status === "cancelled" || status === "returned";
  const currentIndex = STEPS.indexOf(status);

  const items = STEPS.map((key, i) => {
    const done = stopped ? Boolean(at[key]) : i <= currentIndex;
    return { key, done, current: !stopped && i === currentIndex, copy: t.steps[key], at: at[key], dead: false };
  }).filter((item) => !stopped || item.done);
  if (stopped) items.push({ key: status, done: true, current: true, copy: t[status], at: at[status], dead: true });

  return (
    <ol aria-label={t.resultLabel}>
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <li key={item.key} className="relative flex gap-4 pb-8 last:pb-0" aria-current={item.current ? "step" : undefined}>
            {!last && (
              <span
                aria-hidden="true"
                className={`absolute left-4 top-8 h-full w-px -translate-x-1/2 ${items[i + 1].done ? "bg-gold" : "bg-line"}`}
              />
            )}
            <span
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                item.dead
                  ? "border-danger text-danger"
                  : item.done
                    ? "border-gold bg-gold text-obsidian"
                    : "border-line text-muted"
              }`}
            >
              {item.dead ? (
                <X size={16} strokeWidth={1.5} aria-hidden="true" />
              ) : item.done ? (
                <Check size={16} strokeWidth={1.5} aria-hidden="true" />
              ) : (
                <span className="text-small">{i + 1}</span>
              )}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className={`text-body ${item.done ? "text-fg" : "text-muted"}`}>
                {item.copy.title}
                {item.current && <span className="sr-only"> ({t.current})</span>}
              </p>
              {item.done ? (
                <p className="text-small text-muted">
                  {item.copy.text}
                  {item.at ? ` · ${formatDateTime(item.at)}` : ""}
                </p>
              ) : (
                <p className="text-small text-muted">{item.copy.text}</p>
              )}
              {item.key === "shipped" && item.done && children}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default OrderTimeline;
