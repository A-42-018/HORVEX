import { useState } from "react";
import { Button, Input, Modal } from "../../../components/common";
import { strings } from "../../../lib/strings";
import { HERO_FOLDER } from "../../../services/adminHomeContent";
import { heroHooks } from "../../hooks/useHomeContentAdmin";
import DateTimeField from "./DateTimeField";
import MediaImageField from "./MediaImageField";
import { canActivateHero } from "./contentRules";
import {
  HERO_LIMITS,
  changedHeroColumns,
  emptyHeroForm,
  heroFieldId,
  heroToForm,
  heroToPayload,
  validateHero,
} from "./heroForm";

const t = strings.admin.homeContent.hero;
const common = strings.admin.homeContent.common;
const FORM_ID = "hero-form";

const saveError = (error) =>
  error?.code === "42501" || error?.code === "PGRST116" ? common.messages.forbidden : common.messages.saveFailed;

/** Create / edit dialog. `slide` null = new. The parent remounts it per open (key) so state starts fresh. */
export default function HeroModal({ open, slide, rows, onClose, onSaved }) {
  const isNew = !slide;
  const crud = heroHooks.useCrud();
  const [form, setForm] = useState(() =>
    slide ? heroToForm(slide) : { ...emptyHeroForm(), isActive: canActivateHero(rows, null) },
  );
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
    const found = validateHero(form);
    // Turning a slide on counts against the cap of 3 (a slide that is already on is fine).
    if (form.isActive && !canActivateHero(rows, slide)) found.isActive = t.errors.cap;
    if (Object.keys(found).length) {
      setErrors(found);
      document.getElementById(heroFieldId(Object.keys(found)[0]))?.focus();
      return;
    }
    const payload = heroToPayload(form);
    const handlers = {
      onSuccess: () => onSaved(isNew ? t.messages.created(payload.title) : t.messages.saved(payload.title)),
      onError: (error) => setFailure(saveError(error)),
    };
    if (isNew) return crud.create.mutate(payload, handlers);
    const patch = changedHeroColumns(payload, slide);
    if (!Object.keys(patch).length) return onClose();
    return crud.update.mutate({ id: slide.id, patch }, handlers);
  };

  const field = (key, extra = {}) => ({
    id: heroFieldId(key),
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
        <Input label={t.fields.eyebrow} optional maxLength={HERO_LIMITS.eyebrow + 20} {...field("eyebrow")} />
        <Input label={t.fields.title} hint={t.fields.titleHint} maxLength={HERO_LIMITS.title + 20} {...field("title")} />
        <Input label={t.fields.subtitle} optional multiline className="[&_textarea]:min-h-24" {...field("subtitle")} />

        <MediaImageField
          id={heroFieldId("imageDesktop")}
          label={t.fields.imageDesktop}
          hint={t.fields.imageDesktopHint}
          alt={t.alt}
          shape="wide"
          folder={HERO_FOLDER}
          maxDimension={2560}
          value={form.imageDesktop}
          error={errors.imageDesktop}
          onChange={(url) => set("imageDesktop", url)}
        />
        <MediaImageField
          id={heroFieldId("imageMobile")}
          label={t.fields.imageMobile}
          hint={t.fields.imageMobileHint}
          alt={t.alt}
          shape="tall"
          folder={HERO_FOLDER}
          maxDimension={1600}
          value={form.imageMobile}
          onChange={(url) => set("imageMobile", url)}
        />

        <Input label={t.fields.ctaLabel} optional maxLength={HERO_LIMITS.ctaLabel + 20} {...field("ctaLabel")} />
        <Input
          label={t.fields.ctaLink}
          optional
          hint={t.fields.ctaHint}
          autoCapitalize="none"
          spellCheck={false}
          {...field("ctaLink")}
        />

        <fieldset className="flex flex-col gap-3">
          <legend className="text-small text-fg">{t.fields.schedule}</legend>
          <p className="text-small text-muted">{t.fields.scheduleHint}</p>
          <DateTimeField id={heroFieldId("activeFrom")} label={t.fields.activeFrom} value={form.activeFrom} error={errors.activeFrom} onChange={(v) => set("activeFrom", v)} />
          <DateTimeField id={heroFieldId("activeTo")} label={t.fields.activeTo} value={form.activeTo} error={errors.activeTo} onChange={(v) => set("activeTo", v)} />
        </fieldset>

        <div>
          <label htmlFor={heroFieldId("isActive")} className="flex min-h-11 cursor-pointer items-center gap-3 text-small text-fg">
            <input
              id={heroFieldId("isActive")}
              type="checkbox"
              checked={form.isActive}
              aria-invalid={errors.isActive ? true : undefined}
              onChange={(event) => set("isActive", event.target.checked)}
              className="h-5 w-5 shrink-0 accent-gold"
            />
            {t.fields.isActive}
          </label>
          {errors.isActive && (
            <p role="alert" className="text-small text-danger">
              {errors.isActive}
            </p>
          )}
        </div>

        {failure && (
          <p role="alert" className="text-small text-danger">
            {failure}
          </p>
        )}
      </form>
    </Modal>
  );
}
