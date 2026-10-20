import { useState } from "react";
import { Button, Card, Input } from "../../../components/common";
import { strings } from "../../../lib/strings";
import { useSaveOrderDetails } from "../../hooks/useAdminOrders";
import { ACTION_LIMITS, COURIER_SUGGESTIONS, changedActionColumns, toActionsForm, validateActions } from "./orderActionsForm";

const t = strings.admin.orders.detail.actions;

/** Courier, tracking ID and the private admin note. Own Save, separate from status changes. */
function OrderActionsForm({ order, mutation }) {
  const [form, setForm] = useState(() => toActionsForm(order));
  const [errors, setErrors] = useState({});
  const patch = changedActionColumns(order, form);
  const dirty = Object.keys(patch).length > 0;

  const set = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (mutation.status !== "idle") mutation.reset();
  };

  const save = (event) => {
    event.preventDefault();
    const found = validateActions(form);
    setErrors(found);
    if (Object.keys(found).length > 0 || !dirty) return;
    mutation.mutate({ id: order.id, patch });
  };

  const undo = () => {
    setForm(toActionsForm(order));
    setErrors({});
    mutation.reset();
  };

  const errorCopy = mutation.error ? (mutation.error.code === "42501" ? t.forbidden : t.error) : null;

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t.courier}
          optional
          list="order-courier-options"
          value={form.courier}
          onChange={set("courier")}
          error={errors.courier}
          maxLength={ACTION_LIMITS.courier + 20}
          autoComplete="off"
        />
        <Input
          label={t.tracking}
          optional
          value={form.tracking}
          onChange={set("tracking")}
          error={errors.tracking}
          maxLength={ACTION_LIMITS.tracking + 20}
          autoComplete="off"
          hint={t.trackingHint}
        />
      </div>
      <datalist id="order-courier-options">
        {COURIER_SUGGESTIONS.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <Input
        multiline
        label={t.note}
        optional
        value={form.note}
        onChange={set("note")}
        error={errors.note}
        hint={t.noteHint}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" loading={mutation.isPending} disabled={!dirty}>
          {t.save}
        </Button>
        <Button size="sm" variant="ghost" disabled={!dirty || mutation.isPending} onClick={undo}>
          {t.undo}
        </Button>
        <p role="status" className="min-h-5 text-small text-muted">
          {mutation.isSuccess && !dirty ? t.saved : dirty ? t.unsaved : ""}
        </p>
      </div>
      {errorCopy && (
        <p role="alert" className="text-small text-danger">
          {errorCopy}
        </p>
      )}
    </form>
  );
}

export function OrderActionsCard({ order }) {
  // The mutation lives here so "Saved" survives the form re-key below.
  const mutation = useSaveOrderDetails();
  // Re-key on the saved values so the form resets when another admin changes them.
  const key = `${order.courier ?? ""}|${order.tracking_id ?? ""}|${order.admin_note ?? ""}`;
  return (
    <Card as="section" aria-labelledby="order-actions-title" className="flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-1">
        <h2 id="order-actions-title" className="text-h3 text-fg">
          {t.title}
        </h2>
        <p className="text-small text-muted">{t.intro}</p>
      </div>
      <OrderActionsForm key={key} order={order} mutation={mutation} />
    </Card>
  );
}

export default OrderActionsCard;
