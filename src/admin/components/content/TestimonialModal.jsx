import { useState } from "react";
import { Button, Input, Modal, Select } from "../../../components/common";
import { strings } from "../../strings";
import { testimonialHooks } from "../../hooks/useContentAdmin";
import MediaImageField from "../homepage/MediaImageField";
import {
  TESTIMONIAL_LIMITS,
  changedColumns,
  emptyTestimonialForm,
  testimonialFieldId,
  testimonialToForm,
  testimonialToPayload,
  validateTestimonial,
} from "./testimonialForm";

const t = strings.admin.content.testimonials;
const common = strings.admin.homeContent.common;
const FORM_ID = "testimonial-form";

const saveError = (error) =>
  error?.code === "42501" || error?.code === "PGRST116" ? t.messages.forbidden : common.messages.saveFailed;

/** Create / edit dialog. `testimonial` null = new. The parent remounts it per open (key). */
export default function TestimonialModal({ open, testimonial, onClose, onSaved }) {
  const isNew = !testimonial;
  const crud = testimonialHooks.useCrud();
  const [form, setForm] = useState(() => (testimonial ? testimonialToForm(testimonial) : emptyTestimonialForm()));
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
    if (saving) return;
    const found = validateTestimonial(form);
    if (Object.keys(found).length) {
      setErrors(found);
      document.getElementById(testimonialFieldId(Object.keys(found)[0]))?.focus();
      return;
    }
    const payload = testimonialToPayload(form);
    const handlers = {
      onSuccess: () => onSaved(isNew ? t.messages.created(payload.name) : t.messages.saved(payload.name)),
      onError: (error) => setFailure(saveError(error)),
    };
    if (isNew) return crud.create.mutate(payload, handlers);
    const patch = changedColumns(payload, testimonial);
    if (!Object.keys(patch).length) return onClose();
    return crud.update.mutate({ id: testimonial.id, patch }, handlers);
  };

  const field = (key, extra = {}) => ({
    id: testimonialFieldId(key),
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
        <Input label={t.fields.name} maxLength={TESTIMONIAL_LIMITS.name + 20} {...field("name")} />
        <Input label={t.fields.location} optional maxLength={TESTIMONIAL_LIMITS.location + 20} {...field("location")} />
        <Input label={t.fields.text} multiline className="[&_textarea]:min-h-32" {...field("text")} />
        <Select label={t.fields.rating} placeholder={null} options={t.ratingOptions} {...field("rating")} />
        <MediaImageField
          id={testimonialFieldId("photoUrl")}
          label={t.fields.photo}
          hint={t.fields.photoHint}
          alt={t.alt}
          shape="square"
          folder="testimonials"
          maxDimension={600}
          value={form.photoUrl}
          onChange={(url) => set("photoUrl", url)}
        />

        <label htmlFor={testimonialFieldId("isVisible")} className="flex min-h-11 cursor-pointer items-center gap-3 text-small text-fg">
          <input
            id={testimonialFieldId("isVisible")}
            type="checkbox"
            checked={form.isVisible}
            onChange={(event) => set("isVisible", event.target.checked)}
            className="h-5 w-5 shrink-0 accent-gold"
          />
          {t.fields.isVisible}
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
