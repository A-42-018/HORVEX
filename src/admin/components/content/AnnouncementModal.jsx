import { useState } from "react";
import { Button, Input, Modal } from "../../../components/common";
import { strings } from "../../../lib/strings";
import {
  ANNOUNCEMENT_LIMITS,
  announcementFieldId,
  announcementToForm,
  announcementToMessage,
  emptyAnnouncementForm,
  validateAnnouncement,
} from "./announcements";

const t = strings.admin.content.announcements;
const common = strings.admin.homeContent.common;
const FORM_ID = "announcement-form";

/** Create / edit dialog. `message` null = new. Saving is done by the parent (it owns the list). */
export default function AnnouncementModal({ open, message, saving, failure, onClose, onSubmit }) {
  const isNew = !message;
  const [form, setForm] = useState(() => (message ? announcementToForm(message) : emptyAnnouncementForm()));
  const [errors, setErrors] = useState({});

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const submit = (event) => {
    event.preventDefault();
    if (saving) return;
    const found = validateAnnouncement(form);
    if (Object.keys(found).length) {
      setErrors(found);
      document.getElementById(announcementFieldId(Object.keys(found)[0]))?.focus();
      return;
    }
    onSubmit(announcementToMessage(form));
  };

  const field = (key, extra = {}) => ({
    id: announcementFieldId(key),
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
        <Input label={t.fields.text} maxLength={ANNOUNCEMENT_LIMITS.text + 20} {...field("text")} />
        <Input
          label={t.fields.link}
          optional
          hint={t.fields.linkHint}
          autoCapitalize="none"
          spellCheck={false}
          {...field("link")}
        />
        {failure && (
          <p role="alert" className="text-small text-danger">
            {failure}
          </p>
        )}
      </form>
    </Modal>
  );
}
