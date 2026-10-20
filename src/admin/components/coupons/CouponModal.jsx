import { useState } from "react";
import { Button, Input, Modal, Select } from "../../../components/common";
import { strings } from "../../strings";
import { useCouponCrud } from "../../hooks/useCouponAdmin";
import DateTimeField from "../homepage/DateTimeField";
import { changedColumns, emptyForm, fieldId, normalizeCode, toForm, toPayload, TYPES, validateForm } from "./couponForm";

const t = strings.admin.coupons;
const FORM_ID = "coupon-form";

function saveError(error) {
  const where = `${error?.message ?? ""} ${error?.details ?? ""}`;
  if (error?.code === "23505" && /code/i.test(where)) return { field: "code", message: t.errors.codeTaken };
  if (error?.code === "42501" || error?.code === "PGRST116") return { message: t.messages.forbidden };
  return { message: t.messages.saveFailed };
}

/** Create / edit dialog. `coupon` null = new. The parent remounts it per open (key) so state starts fresh. */
export default function CouponModal({ open, coupon, rows, onClose, onSaved }) {
  const isNew = !coupon;
  const crud = useCouponCrud();
  const [form, setForm] = useState(() => (coupon ? toForm(coupon) : emptyForm()));
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState("");
  const saving = crud.create.isPending || crud.update.isPending;
  const codeLocked = Boolean(coupon && coupon.used > 0);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setFailure("");
  };

  const submit = (event) => {
    event.preventDefault();
    const found = validateForm(form, { rows, self: coupon });
    if (Object.keys(found).length) {
      setErrors(found);
      document.getElementById(fieldId(Object.keys(found)[0]))?.focus();
      return;
    }
    const payload = toPayload(form);
    const handlers = {
      onSuccess: () => onSaved(isNew ? t.messages.created(payload.code) : t.messages.saved(payload.code)),
      onError: (error) => {
        const { field, message } = saveError(error);
        if (field) setErrors({ [field]: message });
        else setFailure(message);
      },
    };
    if (isNew) return crud.create.mutate(payload, handlers);
    const patch = changedColumns(payload, coupon);
    if (!Object.keys(patch).length) return onClose();
    return crud.update.mutate({ id: coupon.id, patch }, handlers);
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
          label={t.fields.code}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          maxLength={40}
          disabled={codeLocked}
          hint={codeLocked ? t.fields.codeLocked : t.fields.codeHint}
          {...field("code", { onChange: (event) => set("code", normalizeCode(event.target.value)) })}
        />
        <Select
          label={t.fields.type}
          placeholder={null}
          options={TYPES.map((value) => ({ value, label: t.types[value] }))}
          {...field("type")}
        />
        {form.type === "percent" && (
          <Input label={t.fields.percent} inputMode="numeric" hint={t.fields.percentHint} {...field("value")} />
        )}
        {form.type === "fixed" && (
          <Input label={t.fields.fixed} inputMode="numeric" hint={t.fields.fixedHint} {...field("value")} />
        )}
        {form.type === "free_shipping" && <p className="text-small text-muted">{t.fields.freeShippingNote}</p>}
        <Input label={t.fields.minOrder} optional inputMode="numeric" hint={t.fields.minOrderHint} {...field("minOrder")} />
        <Input label={t.fields.maxUses} optional inputMode="numeric" hint={t.fields.maxUsesHint} {...field("maxUses")} />
        <DateTimeField
          id={fieldId("startsAt")}
          label={t.fields.startsAt}
          value={form.startsAt}
          error={errors.startsAt}
          onChange={(value) => set("startsAt", value)}
        />
        <DateTimeField
          id={fieldId("endsAt")}
          label={t.fields.endsAt}
          value={form.endsAt}
          error={errors.endsAt}
          hint={t.fields.datesHint}
          onChange={(value) => set("endsAt", value)}
        />
        <label htmlFor={fieldId("isActive")} className="flex min-h-11 cursor-pointer items-center gap-3 text-small text-fg">
          <input
            id={fieldId("isActive")}
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => set("isActive", event.target.checked)}
            className="h-5 w-5 shrink-0 accent-gold"
          />
          {t.fields.isActive}
        </label>
        {failure && (
          <p role="alert" className="text-small text-danger">
            {failure}
          </p>
        )}
      </form>
    </Modal>
  );
}
