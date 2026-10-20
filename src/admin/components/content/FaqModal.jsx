import { useState } from "react";
import { Button, Input, Modal } from "../../../components/common";
import { strings } from "../../strings";
import { topicsOf } from "../../../services/adminContent";
import { faqHooks } from "../../hooks/useContentAdmin";
import { FAQ_LIMITS, changedColumns, emptyFaqForm, faqFieldId, faqToForm, faqToPayload, validateFaq } from "./faqForm";

const t = strings.admin.content.faq;
const common = strings.admin.homeContent.common;
const FORM_ID = "faq-form";
const LIST_ID = "faq-topics";

const saveError = (error) =>
  error?.code === "42501" || error?.code === "PGRST116" ? t.messages.forbidden : common.messages.saveFailed;

/** Create / edit dialog. `faq` null = new. The parent remounts it per open (key) so state starts fresh. */
export default function FaqModal({ open, faq, rows, onClose, onSaved }) {
  const isNew = !faq;
  const crud = faqHooks.useCrud();
  const [form, setForm] = useState(() => (faq ? faqToForm(faq) : emptyFaqForm()));
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
    const found = validateFaq(form);
    if (Object.keys(found).length) {
      setErrors(found);
      document.getElementById(faqFieldId(Object.keys(found)[0]))?.focus();
      return;
    }
    const payload = faqToPayload(form);
    const handlers = {
      onSuccess: () => onSaved(isNew ? t.messages.created(payload.question) : t.messages.saved(payload.question)),
      onError: (error) => setFailure(saveError(error)),
    };
    if (isNew) return crud.create.mutate(payload, handlers);
    const patch = changedColumns(payload, faq);
    if (!Object.keys(patch).length) return onClose();
    return crud.update.mutate({ id: faq.id, patch }, handlers);
  };

  const field = (key, extra = {}) => ({
    id: faqFieldId(key),
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
        <Input label={t.fields.question} multiline className="[&_textarea]:min-h-20" maxLength={FAQ_LIMITS.question + 20} {...field("question")} />
        <Input label={t.fields.answer} multiline className="[&_textarea]:min-h-40" {...field("answer")} />
        <Input label={t.fields.topic} optional hint={t.fields.topicHint} list={LIST_ID} maxLength={FAQ_LIMITS.topic + 20} {...field("topic")} />
        <datalist id={LIST_ID}>
          {topicsOf(rows).map((topic) => (
            <option key={topic} value={topic} />
          ))}
        </datalist>

        <label htmlFor={faqFieldId("isVisible")} className="flex min-h-11 cursor-pointer items-center gap-3 text-small text-fg">
          <input
            id={faqFieldId("isVisible")}
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
