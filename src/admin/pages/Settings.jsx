import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router";
import { Button, Card, Input, Modal, Skeleton } from "../../components/common";
import { strings } from "../../lib/strings";
import MediaImageField from "../components/homepage/MediaImageField";
import QuickToggle from "../components/products/QuickToggle";
import { changedColumns, fieldId, LIMITS, SOCIAL_KEYS, toForm, toPayload, validateForm } from "../components/settings/settingsForm";
import { useSaveSettings, useSettingsRow } from "../hooks/useSettingsAdmin";

const t = strings.admin.settings;
const FORM_ID = "settings-form";

const isForbidden = (error) => error?.code === "42501" || error?.code === "PGRST116";

function Section({ id, children }) {
  const copy = t.sections[id];
  return (
    <Card as="section" aria-labelledby={`set-${id}-title`} className="flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 id={`set-${id}-title`} className="text-h3 text-fg">
          {copy.title}
        </h2>
        <p className="max-w-prose text-small text-muted">{copy.intro}</p>
      </div>
      {children}
    </Card>
  );
}

// After a save the form reloads the row the server returned (phones come back normalised).
function SettingsForm({ row }) {
  const save = useSaveSettings();
  const [form, setForm] = useState(() => toForm(row));
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);

  const saved = toForm(row);
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setFailure("");
    setNotice("");
  };

  const commit = (nextForm) => {
    const found = validateForm(nextForm);
    if (Object.keys(found).length) {
      setErrors(found);
      document.getElementById(fieldId(Object.keys(found)[0]))?.focus();
      return;
    }
    const patch = changedColumns(toPayload(nextForm), row);
    if (!Object.keys(patch).length) {
      setNotice(t.noChange);
      return;
    }
    save.mutate(patch, {
      onSuccess: (result) => {
        setForm(toForm(result));
        setNotice(t.saved);
      },
      onError: (error) => setFailure(isForbidden(error) ? t.forbidden : t.saveFailed),
    });
  };

  const submit = (event) => {
    event.preventDefault();
    // Closing the store is a big switch: confirm before it is saved.
    if (form.maintenance && !saved.maintenance) return setConfirmClose(true);
    return commit(form);
  };

  const field = (key, extra = {}) => ({
    id: fieldId(key),
    value: form[key],
    error: errors[key],
    onChange: (event) => set(key, event.target.value),
    ...extra,
  });

  const image = (key, label, extra = {}) => (
    <MediaImageField
      id={fieldId(key)}
      label={label}
      alt=""
      folder="brand"
      value={form[key]}
      error={errors[key]}
      onChange={(url) => set(key, url)}
      {...extra}
    />
  );

  return (
    <form id={FORM_ID} noValidate onSubmit={submit} className="flex flex-col gap-6">
      <Section id="status">
        <div className="flex items-center gap-3">
          <QuickToggle checked={form.maintenance} onChange={(value) => set("maintenance", value)} label={t.fields.maintenance} name={t.fields.maintenance} showLabel />
        </div>
        <p className={`text-small ${form.maintenance ? "text-danger" : "text-muted"}`}>
          {form.maintenance ? t.fields.maintenanceOn : t.fields.maintenanceOff}
        </p>
      </Section>

      <Section id="brand">
        <Input label={t.fields.brandName} maxLength={LIMITS.brand + 10} {...field("brandName")} />
        <div className="grid gap-6 sm:grid-cols-2">
          {image("logoUrl", t.fields.logoUrl, { shape: "wide", maxDimension: 800 })}
          {image("logoLightUrl", t.fields.logoLightUrl, { shape: "wide", maxDimension: 800 })}
          {image("faviconUrl", t.fields.faviconUrl, { shape: "square", maxDimension: 256, hint: t.fields.faviconHint })}
          {image("ogImageUrl", t.fields.ogImageUrl, { shape: "wide", maxDimension: 1600, hint: t.fields.ogHint })}
        </div>
      </Section>

      <Section id="contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t.fields.contactPhone} type="tel" inputMode="tel" autoComplete="off" hint={t.fields.phoneHint} {...field("contactPhone")} />
          <Input label={t.fields.whatsappNumber} type="tel" inputMode="tel" autoComplete="off" hint={t.fields.whatsappHint} {...field("whatsappNumber")} />
        </div>
        <Input label={t.fields.contactEmail} type="email" inputMode="email" autoComplete="off" {...field("contactEmail")} />
        <Input label={t.fields.address} multiline className="[&_textarea]:min-h-24" {...field("address")} />
        <Input label={t.fields.footerText} multiline hint={t.fields.footerHint} className="[&_textarea]:min-h-24" {...field("footerText")} />
      </Section>

      <Section id="socials">
        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_KEYS.map((key) => (
            <Input key={key} label={t.fields[key]} type="url" inputMode="url" autoComplete="off" {...field(`social_${key}`)} />
          ))}
        </div>
      </Section>

      <Section id="delivery">
        <Input label={t.fields.couriers} multiline hint={t.fields.couriersHint} className="[&_textarea]:min-h-24" {...field("couriers")} />
      </Section>

      <Section id="seo">
        <Input label={t.fields.seoTitle} hint={t.fields.seoTitleHint} {...field("seoTitle")} />
        <Input label={t.fields.seoDesc} multiline hint={t.fields.seoDescHint} className="[&_textarea]:min-h-24" {...field("seoDesc")} />
      </Section>

      <Section id="tracking">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t.fields.ga4Id} autoCapitalize="characters" autoComplete="off" hint={t.fields.ga4Hint} {...field("ga4Id")} />
          <Input label={t.fields.fbPixelId} inputMode="numeric" autoComplete="off" hint={t.fields.pixelHint} {...field("fbPixelId")} />
        </div>
      </Section>

      <p role="status" className="sr-only">
        {notice}
      </p>
      <div className="sticky bottom-[calc(3.5625rem+env(safe-area-inset-bottom))] z-20 -mx-gutter flex flex-wrap items-center gap-3 border-t border-line bg-surface px-gutter py-3 lg:bottom-0">
        <Button type="submit" form={FORM_ID} loading={save.isPending} disabled={!dirty && !save.isPending}>
          {save.isPending ? t.saving : t.save}
        </Button>
        {dirty && (
          <Button
            variant="ghost"
            disabled={save.isPending}
            onClick={() => {
              setForm(saved);
              setErrors({});
              setFailure("");
            }}
          >
            {t.undo}
          </Button>
        )}
        {dirty && !failure && !save.isPending && <span className="text-small text-muted">{t.unsaved}</span>}
        {notice && !dirty && (
          <span aria-hidden="true" className="text-small text-positive">
            {notice}
          </span>
        )}
        {failure && (
          <span role="alert" className="text-small text-danger">
            {failure}
          </span>
        )}
      </div>

      <Modal
        open={confirmClose}
        onClose={() => setConfirmClose(false)}
        title={t.confirm.title}
        description={t.confirm.body}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setConfirmClose(false);
                set("maintenance", false);
              }}
            >
              {t.confirm.cancel}
            </Button>
            <Button
              onClick={() => {
                setConfirmClose(false);
                commit(form);
              }}
            >
              {t.confirm.confirm}
            </Button>
          </>
        }
      />
    </form>
  );
}

function Settings() {
  const { data: row, isPending, isError, refetch } = useSettingsRow();

  return (
    <div className="flex flex-col gap-6">
      <title>{`${t.title} | WRISTORY Admin`}</title>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h3 text-fg">{t.title}</h1>
        <Button as={Link} to="/" target="_blank" rel="noreferrer" variant="secondary" size="sm" className="gap-2">
          <ExternalLink aria-hidden="true" size={16} strokeWidth={1.5} />
          {t.viewStore}
        </Button>
      </div>
      <p className="max-w-prose text-small text-muted">{t.intro}</p>

      {isPending && (
        <div aria-busy="true" aria-label={strings.admin.checking} className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      )}
      {isError && !row && (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-small text-danger">{t.error}</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            {t.retry}
          </Button>
        </div>
      )}
      {row && <SettingsForm row={row} />}
    </div>
  );
}

export default Settings;
