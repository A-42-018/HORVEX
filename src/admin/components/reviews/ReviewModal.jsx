import { useState } from "react";
import { Button, Input, Modal, Select } from "../../../components/common";
import { strings } from "../../strings";
import { useCreateReview, useReviewProducts } from "../../hooks/useReviewAdmin";
import MediaImageField from "../homepage/MediaImageField";
import { REVIEW_LIMITS, emptyReviewForm, reviewFieldId, reviewToPayload, validateReview } from "./reviewRules";

const t = strings.admin.reviews;
const common = strings.admin.homeContent.common;
const FORM_ID = "review-form";

const saveError = (error) => (error?.code === "42501" || error?.code === "PGRST116" ? t.messages.forbidden : common.messages.saveFailed);

/** Add a review by hand (e.g. a Facebook comment). The parent remounts it per open (key). */
export default function ReviewModal({ open, onClose, onSaved }) {
  const create = useCreateReview();
  const products = useReviewProducts(open);
  const [form, setForm] = useState(emptyReviewForm);
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState("");

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setFailure("");
  };

  const submit = (event) => {
    event.preventDefault();
    if (create.isPending) return;
    const found = validateReview(form);
    if (Object.keys(found).length) {
      setErrors(found);
      document.getElementById(reviewFieldId(Object.keys(found)[0]))?.focus();
      return;
    }
    const payload = reviewToPayload(form);
    create.mutate(payload, {
      onSuccess: () => onSaved(t.messages.created(payload.name)),
      onError: (error) => setFailure(saveError(error)),
    });
  };

  const field = (key, extra = {}) => ({
    id: reviewFieldId(key),
    value: form[key],
    error: errors[key],
    onChange: (event) => set(key, event.target.value),
    ...extra,
  });

  const productOptions = [{ value: "", label: t.fields.noProduct }, ...(products.data ?? []).map((p) => ({ value: p.id, label: p.name }))];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t.newTitle}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {common.cancel}
          </Button>
          <Button type="submit" form={FORM_ID} loading={create.isPending}>
            {create.isPending ? common.saving : common.create}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} noValidate onSubmit={submit} className="flex flex-col gap-4">
        <Select label={t.fields.product} placeholder={null} options={productOptions} hint={products.isError ? t.productsError : undefined} {...field("productId")} />
        <Input label={t.fields.name} maxLength={REVIEW_LIMITS.name + 20} {...field("name")} />
        <Select label={t.fields.rating} placeholder={null} options={t.ratingOptions} {...field("rating")} />
        <Input label={t.fields.text} multiline className="[&_textarea]:min-h-32" {...field("text")} />
        <MediaImageField
          id={reviewFieldId("photoUrl")}
          label={t.fields.photo}
          hint={t.fields.photoHint}
          alt={t.photoAlt}
          shape="square"
          folder="reviews"
          maxDimension={1000}
          value={form.photoUrl}
          onChange={(url) => set("photoUrl", url)}
        />
        <label htmlFor={reviewFieldId("approved")} className="flex min-h-11 cursor-pointer items-center gap-3 text-small text-fg">
          <input
            id={reviewFieldId("approved")}
            type="checkbox"
            checked={form.approved}
            onChange={(event) => set("approved", event.target.checked)}
            className="h-5 w-5 shrink-0 accent-gold"
          />
          {t.fields.approved}
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
