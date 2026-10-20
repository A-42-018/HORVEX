import { useState } from "react";
import { Button, Input, Modal, Skeleton } from "../../../components/common";
import { slugify } from "../../../lib/slug";
import { strings } from "../../strings";
import { useCollectionPicks, useRuleCategories, useSaveCollection } from "../../hooks/useCollectionAdmin";
import CollectionBannerField from "./CollectionBannerField";
import CollectionPicks from "./CollectionPicks";
import CollectionRules from "./CollectionRules";
import { changedColumns, emptyForm, fieldId, LIMITS, MODES, sameIds, toForm, toPayload, validateForm } from "./collectionForm";

const t = strings.admin.collections;
const FORM_ID = "collection-form";

function saveError(error) {
  if (error?.picksFailed) return { message: t.messages.picksFailed };
  const where = `${error?.message ?? ""} ${error?.details ?? ""}`;
  if (error?.code === "23505" && /slug/i.test(where)) return { field: "slug", message: t.errors.slugTaken };
  if (error?.code === "42501" || error?.code === "PGRST116") return { message: t.messages.forbidden };
  return { message: t.messages.saveFailed };
}

function DateField({ id, label, value, error, onChange }) {
  return (
    <div className="flex items-start gap-2">
      <Input id={id} type="datetime-local" label={label} value={value} error={error} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1" />
      {value && (
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => onChange("")}>
          {t.fields.clearDate}
          <span className="sr-only"> {label}</span>
        </Button>
      )}
    </div>
  );
}

/** Create / edit dialog. `collection` null = new. The parent remounts it per open (key) so state starts fresh. */
export default function CollectionModal({ open, collection, rows, onClose, onSaved }) {
  const isNew = !collection;
  const save = useSaveCollection();
  const categories = useRuleCategories();
  const [form, setForm] = useState(() => (collection ? toForm(collection) : emptyForm()));
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState("");
  const [slugEdited, setSlugEdited] = useState(!isNew);
  const [picked, setPicked] = useState(null); // null = list untouched
  // The saved list is only needed to edit a hand-picked collection that already exists.
  const linked = useCollectionPicks(collection?.id, !isNew && form.mode === "manual");

  const set = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "title" && !slugEdited) next.slug = slugify(value);
      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: undefined, ...(key === "title" && !slugEdited ? { slug: undefined } : {}) }));
    setFailure("");
  };
  const setRule = (key, value) => {
    setForm((prev) => ({ ...prev, rules: { ...prev.rules, [key]: value } }));
    setErrors((prev) => ({ ...prev, [key]: undefined, rules: undefined }));
    setFailure("");
  };

  const picksLoading = !isNew && form.mode === "manual" && linked.isPending;
  const picksBroken = !isNew && form.mode === "manual" && linked.isError;

  const submit = (event) => {
    event.preventDefault();
    const found = validateForm(form, { rows, selfId: collection?.id ?? null });
    if (Object.keys(found).length) {
      setErrors(found);
      document.getElementById(fieldId(Object.keys(found)[0]))?.focus();
      return;
    }
    const payload = toPayload(form);
    const patch = isNew ? payload : changedColumns(payload, collection);
    const savedIds = linked.data?.map((p) => p.id);
    // Only a hand-picked collection writes its list, and only when the list changed (or is new).
    const productIds =
      form.mode === "manual" && picked && (isNew ? picked.length > 0 : !savedIds || !sameIds(picked.map((p) => p.id), savedIds))
        ? picked.map((p) => p.id)
        : null;
    if (!isNew && !Object.keys(patch).length && !productIds) return onClose();
    save.mutate(
      { collection, payload, patch, productIds },
      {
        onSuccess: () => onSaved(isNew ? t.messages.created(payload.title) : t.messages.saved(payload.title)),
        onError: (error) => {
          const { field, message } = saveError(error);
          if (field) setErrors({ [field]: message });
          else setFailure(message);
        },
      },
    );
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
      size="lg"
      title={isNew ? t.newTitle : t.editTitle}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button type="submit" form={FORM_ID} loading={save.isPending} disabled={picksLoading || picksBroken}>
            {save.isPending ? t.saving : isNew ? t.create : t.save}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} noValidate onSubmit={submit} className="flex flex-col gap-5">
        <Input label={t.fields.title} maxLength={LIMITS.title + 20} {...field("title")} />
        <Input
          label={t.fields.slug}
          autoCapitalize="none"
          spellCheck={false}
          hint={isNew ? t.fields.slugHintNew : t.fields.slugHint}
          {...field("slug", {
            onChange: (event) => {
              setSlugEdited(true);
              set("slug", event.target.value);
            },
          })}
        />
        <Input label={t.fields.description} optional multiline className="[&_textarea]:min-h-24" {...field("description")} />
        <CollectionBannerField value={form.banner} onChange={(url) => set("banner", url)} />

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-small font-semibold text-fg">{t.fields.mode}</legend>
          <div role="radiogroup" className="flex flex-wrap gap-x-6">
            {MODES.map((mode) => (
              <label key={mode} className="flex min-h-11 cursor-pointer items-center gap-3 text-small text-fg">
                <input
                  type="radio"
                  name="collection-mode"
                  value={mode}
                  checked={form.mode === mode}
                  onChange={() => set("mode", mode)}
                  className="h-5 w-5 shrink-0 accent-gold"
                />
                {t.modes[mode]}
              </label>
            ))}
          </div>
        </fieldset>

        {form.mode === "rules" ? (
          <CollectionRules rules={form.rules} categories={categories.data ?? []} errors={errors} onChange={setRule} />
        ) : (
          <section aria-labelledby="col-picks-title" className="flex flex-col gap-3">
            <h3 id="col-picks-title" className="text-small font-semibold text-fg">
              {t.picks.title}
            </h3>
            {picksLoading && (
              <div aria-busy="true" aria-label={t.picks.loading} className="flex flex-col gap-2">
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
              </div>
            )}
            {picksBroken && (
              <div role="alert" className="flex flex-col items-start gap-2">
                <p className="text-small text-danger">{t.picks.loadError}</p>
                <Button variant="secondary" size="sm" onClick={() => linked.refetch()}>
                  {t.retry}
                </Button>
              </div>
            )}
            {!picksLoading && !picksBroken && <CollectionPicks initial={picked ?? linked.data ?? []} onChange={setPicked} />}
            {!isNew && collection.mode === "rules" && <p className="text-small text-muted">{t.picks.modeNote}</p>}
          </section>
        )}

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-small font-semibold text-fg">{t.fields.schedule}</legend>
          <p className="text-small text-muted">{t.fields.scheduleHint}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <DateField id={fieldId("activeFrom")} label={t.fields.activeFrom} value={form.activeFrom} error={errors.activeFrom} onChange={(v) => set("activeFrom", v)} />
            <DateField id={fieldId("activeTo")} label={t.fields.activeTo} value={form.activeTo} error={errors.activeTo} onChange={(v) => set("activeTo", v)} />
          </div>
        </fieldset>

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
