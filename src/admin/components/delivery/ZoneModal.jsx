import { useState } from "react";
import { Button, Input, Modal } from "../../../components/common";
import { strings } from "../../../lib/strings";
import { useZoneCrud } from "../../hooks/useZoneAdmin";
import { asksDistrict, changedColumns, emptyForm, fieldId, LIMITS, toForm, toPayload, validateForm } from "./zoneForm";

const t = strings.admin.delivery;
const FORM_ID = "zone-form";

function saveError(error) {
  if (error?.code === "42501" || error?.code === "PGRST116") return t.messages.forbidden;
  return t.messages.saveFailed;
}

/** Create / edit dialog. `zone` null = new. The parent remounts it per open (key) so state starts fresh. */
export default function ZoneModal({ open, zone, rows, onClose, onSaved }) {
  const isNew = !zone;
  const crud = useZoneCrud();
  const [form, setForm] = useState(() => (zone ? toForm(zone) : emptyForm()));
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState("");
  const saving = crud.create.isPending || crud.update.isPending;

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setFailure("");
  };

  const submit = (event) => {
    event.preventDefault();
    const found = validateForm(form, { rows, self: zone });
    if (Object.keys(found).length) {
      setErrors(found);
      document.getElementById(fieldId(Object.keys(found)[0]))?.focus();
      return;
    }
    const payload = toPayload(form);
    const handlers = {
      onSuccess: () => onSaved(isNew ? t.messages.created(payload.name) : t.messages.saved(payload.name)),
      onError: (error) => setFailure(saveError(error)),
    };
    if (isNew) return crud.create.mutate(payload, handlers);
    const patch = changedColumns(payload, zone);
    if (!Object.keys(patch).length) return onClose();
    return crud.update.mutate({ id: zone.id, patch }, handlers);
  };

  const field = (key, extra = {}) => ({
    id: fieldId(key),
    value: form[key],
    error: errors[key],
    onChange: (event) => set(key, event.target.value),
    ...extra,
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isNew ? t.newTitle : t.editTitle}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button type="submit" form={FORM_ID} loading={saving}>
            {saving ? t.saving : isNew ? t.create : t.save}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} noValidate onSubmit={submit} className="flex flex-col gap-4">
        <Input
          label={t.fields.name}
          maxLength={LIMITS.name + 20}
          hint={asksDistrict(form.name) ? t.fields.districtNote : undefined}
          {...field("name")}
        />
        <Input label={t.fields.charge} inputMode="numeric" hint={t.fields.chargeHint} {...field("charge")} />
        <Input label={t.fields.eta} optional hint={t.fields.etaHint} {...field("eta")} />
        <div>
          <label htmlFor={fieldId("isActive")} className="flex min-h-11 cursor-pointer items-center gap-3 text-small text-fg">
            <input
              id={fieldId("isActive")}
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => set("isActive", event.target.checked)}
              aria-invalid={errors.isActive ? true : undefined}
              className="h-5 w-5 shrink-0 accent-gold"
            />
            {t.fields.isActive}
          </label>
          {errors.isActive && (
            <p role="alert" className="text-small text-danger">
              {errors.isActive}
            </p>
          )}
        </div>
        {failure && (
          <p role="alert" className="text-small text-danger">
            {failure}
          </p>
        )}
      </form>
    </Modal>
  );
}
