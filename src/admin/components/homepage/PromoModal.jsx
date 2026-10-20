import { useState } from "react";
import { Button, Input, Modal } from "../../../components/common";
import { strings } from "../../../lib/strings";
import { PROMO_FOLDER } from "../../../services/adminHomeContent";
import { promoHooks } from "../../hooks/useHomeContentAdmin";
import DateTimeField from "./DateTimeField";
import MediaImageField from "./MediaImageField";
import {
  PROMO_LIMITS,
  changedPromoColumns,
  emptyPromoForm,
  promoFieldId,
  promoToForm,
  promoToPayload,
  validatePromo,
} from "./promoForm";

const t = strings.admin.homeContent.promo;
const common = strings.admin.homeContent.common;
const FORM_ID = "promo-form";

const saveError = (error) =>
  error?.code === "42501" || error?.code === "PGRST116" ? common.messages.forbidden : common.messages.saveFailed;

/** Create / edit dialog. `banner` null = new. The parent remounts it per open (key) so state starts fresh. */
export default function PromoModal({ open, banner, onClose, onSaved }) {
  const isNew = !banner;
  const crud = promoHooks.useCrud();
  const [form, setForm] = useState(() => (banner ? promoToForm(banner) : emptyPromoForm()));
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState("");
  const saving = crud.create.isPending || crud.update.isPending;

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined, ...(key === "image" ? { title: undefined } : {}) }));
    setFailure("");
  };

  const submit = (event) => {
    event.preventDefault();
    if (saving) return;
    const found = validatePromo(form, { original: banner });
    if (Object.keys(found).length) {
      setErrors(found);
      document.getElementById(promoFieldId(Object.keys(found)[0]))?.focus();
      return;
    }
    const payload = promoToPayload(form);
    const name = payload.title || t.untitled;
    const handlers = {
      onSuccess: () => onSaved(isNew ? t.messages.created(name) : t.messages.saved(name)),
      onError: (error) => setFailure(saveError(error)),
    };
    if (isNew) return crud.create.mutate(payload, handlers);
    const patch = changedPromoColumns(payload, banner);
    if (!Object.keys(patch).length) return onClose();
    return crud.update.mutate({ id: banner.id, patch }, handlers);
  };

  const field = (key, extra = {}) => ({
    id: promoFieldId(key),
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
            {common.cancel}
          </Button>
          <Button type="submit" form={FORM_ID} loading={saving}>
            {saving ? common.saving : isNew ? common.create : common.save}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} noValidate onSubmit={submit} className="flex flex-col gap-4">
        <Input label={t.fields.title} maxLength={PROMO_LIMITS.title + 20} {...field("title")} />
        <Input label={t.fields.subtitle} optional multiline className="[&_textarea]:min-h-24" {...field("subtitle")} />

        <MediaImageField
          id={promoFieldId("image")}
          label={t.fields.image}
          hint={t.fields.imageHint}
          alt={t.alt}
          shape="wide"
          folder={PROMO_FOLDER}
          maxDimension={1600}
          value={form.image}
          onChange={(url) => set("image", url)}
        />
        <MediaImageField
          id={promoFieldId("imageMobile")}
          label={t.fields.imageMobile}
          hint={t.fields.imageMobileHint}
          alt={t.alt}
          shape="square"
          folder={PROMO_FOLDER}
          maxDimension={1200}
          value={form.imageMobile}
          onChange={(url) => set("imageMobile", url)}
        />

        <Input
          label={t.fields.link}
          optional
          hint={t.fields.linkHint}
          autoCapitalize="none"
          spellCheck={false}
          {...field("link")}
        />
        <DateTimeField
          id={promoFieldId("countdownTo")}
          label={t.fields.countdownTo}
          hint={t.fields.countdownHint}
          value={form.countdownTo}
          error={errors.countdownTo}
          onChange={(value) => set("countdownTo", value)}
        />

        <label htmlFor={promoFieldId("isActive")} className="flex min-h-11 cursor-pointer items-center gap-3 text-small text-fg">
          <input
            id={promoFieldId("isActive")}
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
