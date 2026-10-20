import { useState } from "react";
import { Button, Input, Modal, Select } from "../../../components/common";
import { slugify } from "../../../lib/slug";
import { strings } from "../../../lib/strings";
import { useCategoryCrud } from "../../hooks/useCategoryAdmin";
import CategoryImageField from "./CategoryImageField";
import {
  changedColumns,
  emptyForm,
  fieldId,
  isProtected,
  LIMITS,
  parentOptions,
  toForm,
  toPayload,
  validateForm,
} from "./categoryForm";

const t = strings.admin.categories;
const FORM_ID = "category-form";

function saveError(error) {
  const where = `${error?.message ?? ""} ${error?.details ?? ""}`;
  if (error?.code === "23505" && /slug/i.test(where)) return { field: "slug", message: t.errors.slugTaken };
  if (error?.code === "42501" || error?.code === "PGRST116") return { message: t.messages.forbidden };
  return { message: t.messages.saveFailed };
}

/** Create / edit dialog. `category` null = new. The parent remounts it per open (key) so state starts fresh. */
export default function CategoryModal({ open, category, rows, onClose, onSaved }) {
  const isNew = !category;
  const crud = useCategoryCrud();
  const [form, setForm] = useState(() => (category ? toForm(category) : emptyForm()));
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState("");
  const [slugEdited, setSlugEdited] = useState(!isNew);
  const locked = isProtected(category);
  const saving = crud.create.isPending || crud.update.isPending;

  const set = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && !slugEdited) next.slug = slugify(value);
      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: undefined, ...(key === "name" && !slugEdited ? { slug: undefined } : {}) }));
    setFailure("");
  };

  const submit = (event) => {
    event.preventDefault();
    const found = validateForm(form, { rows, selfId: category?.id ?? null });
    if (Object.keys(found).length) {
      setErrors(found);
      document.getElementById(fieldId(Object.keys(found)[0]))?.focus();
      return;
    }
    const payload = toPayload(form);
    const handlers = {
      onSuccess: () => onSaved(isNew ? t.messages.created(payload.name) : t.messages.saved(payload.name)),
      onError: (error) => {
        const { field, message } = saveError(error);
        if (field) setErrors({ [field]: message });
        else setFailure(message);
      },
    };
    if (isNew) return crud.create.mutate(payload, handlers);
    const patch = changedColumns(payload, category);
    if (!Object.keys(patch).length) return onClose();
    return crud.update.mutate({ id: category.id, patch }, handlers);
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
        <Input label={t.fields.name} maxLength={LIMITS.name + 20} {...field("name")} />
        <Input
          label={t.fields.slug}
          autoCapitalize="none"
          spellCheck={false}
          disabled={locked}
          hint={locked ? t.protectedNote : isNew ? t.fields.slugHintNew : t.fields.slugHint}
          {...field("slug", {
            onChange: (event) => {
              setSlugEdited(true);
              set("slug", event.target.value);
            },
          })}
        />
        <Input label={t.fields.description} optional multiline className="[&_textarea]:min-h-24" {...field("description")} />
        <Select
          label={t.fields.parent}
          placeholder={null}
          options={[{ value: "", label: t.fields.noParent }, ...parentOptions(rows, category?.id ?? null)]}
          {...field("parentId")}
        />
        <CategoryImageField value={form.image} onChange={(url) => set("image", url)} />
        <label htmlFor={fieldId("isVisible")} className="flex min-h-11 cursor-pointer items-center gap-3 text-small text-fg">
          <input
            id={fieldId("isVisible")}
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
