import { useState } from "react";
import { Button, Input, Modal } from "../../../components/common";
import { strings } from "../../../lib/strings";
import { useUpdateHomeSection } from "../../hooks/useHomeSectionAdmin";
import { LIMITS, changedColumns, metaFor, toForm, toPayload, validateForm } from "./homeSections";

const t = strings.admin.homepage;
const FORM_ID = "home-section-form";

const failureFor = (error) => (error?.code === "42501" || error?.code === "PGRST116" ? t.messages.forbidden : t.messages.saveFailed);

/** Edits a section's title / subtitle. Mounted with a fresh `key` per open. */
function SectionTextModal({ open, section, onClose, onSaved }) {
  const update = useUpdateHomeSection();
  const [form, setForm] = useState(() => (section ? toForm(section) : { title: "", subtitle: "" }));
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState("");
  const meta = section ? metaFor(section.key) : null;

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = (event) => {
    event.preventDefault();
    if (!section || update.isPending) return;
    const found = validateForm(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    const patch = changedColumns(toPayload(form), section);
    if (!Object.keys(patch).length) return onClose();
    setFailure("");
    update.mutate(
      { id: section.id, patch },
      { onSuccess: () => onSaved(t.messages.saved(meta.label)), onError: (error) => setFailure(failureFor(error)) },
    );
  };

  return (
    <Modal
      open={open && Boolean(section)}
      onClose={onClose}
      title={meta ? t.edit.title(meta.label) : ""}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t.edit.cancel}
          </Button>
          <Button type="submit" form={FORM_ID} loading={update.isPending}>
            {update.isPending ? t.edit.saving : t.edit.save}
          </Button>
        </>
      }
    >
      {meta?.fields && (
        <form id={FORM_ID} noValidate onSubmit={submit} className="flex flex-col gap-4">
          <Input
            label={meta.fields.title}
            optional
            maxLength={LIMITS.title + 20}
            hint={t.edit.blankHint}
            value={form.title}
            error={errors.title}
            onChange={(event) => set("title", event.target.value)}
          />
          <Input
            label={meta.fields.subtitle}
            optional
            multiline
            maxLength={LIMITS.subtitle + 40}
            hint={t.edit.blankHint}
            className="[&_textarea]:min-h-24"
            value={form.subtitle}
            error={errors.subtitle}
            onChange={(event) => set("subtitle", event.target.value)}
          />
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

export default SectionTextModal;
