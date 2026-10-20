import { useState } from "react";
import { Button, Input, Modal } from "../../../components/common";
import PageBody from "../../../components/pages/PageBody";
import { strings } from "../../strings";
import { usePageUpdate } from "../../hooks/useContentAdmin";
import { PAGE_LIMITS, changedColumns, pageFieldId, pageToForm, pageToPayload, validatePage } from "./pageForm";

const t = strings.admin.content.pages;
const common = strings.admin.homeContent.common;
const FORM_ID = "page-form";

const saveError = (error) =>
  error?.code === "42501" || error?.code === "PGRST116" ? t.messages.forbidden : common.messages.saveFailed;

const modeClass = (on) =>
  `min-h-11 rounded-control px-4 text-small font-semibold transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus ${
    on ? "bg-brand text-obsidian" : "text-muted hover:text-fg"
  }`;

/** Edit dialog for one page. The parent remounts it per open (key) so state starts fresh. */
export default function PageModal({ open, page, onClose, onSaved }) {
  const update = usePageUpdate();
  const [form, setForm] = useState(() => (page ? pageToForm(page) : null));
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState("");
  const [preview, setPreview] = useState(false);
  const saving = update.isPending;

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setFailure("");
  };

  const submit = (event) => {
    event.preventDefault();
    if (saving || !page) return;
    const found = validatePage(form);
    if (Object.keys(found).length) {
      setErrors(found);
      if (found.content) setPreview(false);
      setTimeout(() => document.getElementById(pageFieldId(Object.keys(found)[0]))?.focus(), 0);
      return;
    }
    const payload = pageToPayload(form);
    const patch = changedColumns(payload, page);
    if (!Object.keys(patch).length) return onClose();
    return update.mutate(
      { id: page.id, patch },
      { onSuccess: () => onSaved(t.messages.saved(payload.title)), onError: (error) => setFailure(saveError(error)) },
    );
  };

  const field = (key, extra = {}) => ({
    id: pageFieldId(key),
    value: form?.[key] ?? "",
    error: errors[key],
    onChange: (event) => set(key, event.target.value),
    ...extra,
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={t.editTitle(page?.title ?? "")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {common.cancel}
          </Button>
          <Button type="submit" form={FORM_ID} loading={saving}>
            {saving ? common.saving : common.save}
          </Button>
        </>
      }
    >
      {form && (
        <form id={FORM_ID} noValidate onSubmit={submit} className="flex flex-col gap-4">
          <Input label={t.fields.title} maxLength={PAGE_LIMITS.title + 20} {...field("title")} />

          <div className="flex flex-col gap-2">
            <div role="group" aria-label={t.modeLabel} className="flex gap-1">
              <button type="button" aria-pressed={!preview} onClick={() => setPreview(false)} className={modeClass(!preview)}>
                {t.write}
              </button>
              <button type="button" aria-pressed={preview} onClick={() => setPreview(true)} className={modeClass(preview)}>
                {t.preview}
              </button>
            </div>
            {preview ? (
              <div className="min-h-48 rounded-control border border-line p-4">
                {form.content.trim() ? <PageBody content={form.content} /> : <p className="text-small text-muted">{t.previewEmpty}</p>}
              </div>
            ) : (
              <Input
                label={t.fields.content}
                multiline
                hint={t.fields.contentHint}
                className="[&_textarea]:min-h-72"
                {...field("content")}
              />
            )}
          </div>

          <Input label={t.fields.seoDesc} optional hint={t.fields.seoDescHint} maxLength={PAGE_LIMITS.seoDesc + 20} {...field("seoDesc")} />

          <label htmlFor={pageFieldId("isPublished")} className="flex min-h-11 cursor-pointer items-center gap-3 text-small text-fg">
            <input
              id={pageFieldId("isPublished")}
              type="checkbox"
              checked={form.isPublished}
              onChange={(event) => set("isPublished", event.target.checked)}
              className="h-5 w-5 shrink-0 accent-gold"
            />
            {t.fields.isPublished}
          </label>

          {failure && (
            <p role="alert" className="text-small text-danger">
              {failure}
            </p>
          )}
        </form>
      )}
    </Modal>
  );
}
