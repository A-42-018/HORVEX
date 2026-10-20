import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button, Card } from "../../../components/common";
import { strings } from "../../../lib/strings";
import { isClosed, needsConfirm, nextStatuses, pipelineSteps } from "./orderStatus";
import { StatusBadge } from "./OrderRows";

const t = strings.admin.orders.detail;
const label = (status) => strings.admin.orders.tabs[status] ?? status;

function Pipeline({ status, history }) {
  const steps = pipelineSteps(status, history);
  return (
    <ol aria-label={t.status.pipeline} className="flex items-start gap-1 overflow-x-auto pb-1">
      {steps.map((step, i) => {
        const dead = step.state === "stopped";
        const done = step.state === "done" || step.state === "current";
        return (
          <li
            key={step.key}
            aria-current={step.state === "current" || dead ? "step" : undefined}
            className="flex min-w-16 flex-1 flex-col items-center gap-1 text-center"
          >
            <div className="flex w-full items-center">
              <span aria-hidden="true" className={`h-px flex-1 ${i === 0 ? "bg-transparent" : done || dead ? "bg-gold" : "bg-line"}`} />
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                  dead ? "border-danger text-danger" : done ? "border-gold bg-gold text-obsidian" : "border-line text-muted"
                }`}
              >
                {dead ? (
                  <X size={16} strokeWidth={1.5} aria-hidden="true" />
                ) : done ? (
                  <Check size={16} strokeWidth={1.5} aria-hidden="true" />
                ) : (
                  <span className="text-small">{i + 1}</span>
                )}
              </span>
              <span aria-hidden="true" className={`h-px flex-1 ${i === steps.length - 1 ? "bg-transparent" : steps[i + 1].state === "upcoming" ? "bg-line" : "bg-gold"}`} />
            </div>
            <span className={`text-badge ${done || dead ? "text-fg" : "text-muted"}`}>
              {label(step.key)}
              <span className="sr-only">{step.state === "current" ? " (current)" : step.state === "done" ? " (done)" : ""}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Progress strip + the buttons that move the order on (cancel/return ask first). */
function OrderStatusPanel({ order, history, mutation }) {
  const [pending, setPending] = useState(null);
  const options = nextStatuses(order.status);
  const busy = mutation.isPending;

  const change = (to) => {
    mutation.mutate(
      { id: order.id, from: order.status, to },
      { onSettled: () => setPending(null) },
    );
  };

  const errorCopy = (() => {
    const error = mutation.error;
    if (!error) return null;
    if (error.code === "PGRST116") return t.status.stale;
    if (error.code === "42501") return t.status.forbidden;
    return t.status.error;
  })();

  return (
    <Card as="section" aria-labelledby="order-status-title" className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="order-status-title" className="text-h3 text-fg">
          {t.status.title}
        </h2>
        <StatusBadge status={order.status} />
      </div>

      <Pipeline status={order.status} history={history} />

      {isClosed(order.status) ? (
        <p className="text-small text-muted">{t.status.terminal}</p>
      ) : pending ? (
        <div role="alertdialog" aria-labelledby="order-confirm-title" className="flex flex-col gap-3 rounded-card border border-danger p-4">
          <p id="order-confirm-title" className="text-small font-semibold text-fg">
            {pending === "cancelled" ? t.status.confirmCancel : t.status.confirmReturn}
          </p>
          <p className="text-small text-muted">{t.status.confirmBody}</p>
          <div className="flex flex-wrap gap-3">
            <Button size="sm" loading={busy} onClick={() => change(pending)}>
              {t.status.confirmYes}
            </Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => setPending(null)}>
              {t.status.confirmNo}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-small text-muted">{t.status.moveTo}</p>
          <div className="flex flex-wrap gap-3">
            {options.map((to, i) => (
              <Button
                key={to}
                size="sm"
                variant={i === 0 && !needsConfirm(to) ? "primary" : "secondary"}
                loading={busy}
                onClick={() => (needsConfirm(to) ? setPending(to) : change(to))}
              >
                {t.status.moveButton(label(to))}
              </Button>
            ))}
          </div>
        </div>
      )}

      <p role="status" className="min-h-5 text-small text-muted">
        {busy ? t.status.saving : mutation.isSuccess ? t.status.saved(label(mutation.variables.to)) : ""}
      </p>
      {errorCopy && (
        <p role="alert" className="text-small text-danger">
          {errorCopy}
        </p>
      )}
    </Card>
  );
}

export default OrderStatusPanel;
