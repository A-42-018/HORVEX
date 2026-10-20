import { Input, Select } from "../../../components/common";
import { strings } from "../../../lib/strings";
import { BADGE_RULES, fieldId, GENDER_RULES } from "./collectionForm";

const t = strings.admin.collections.rules;
const optionsOf = (keys, labels) => keys.map((value) => ({ value, label: labels[value] }));

function Check({ id, checked, onChange, children }) {
  return (
    <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3 text-small text-fg">
      <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 shrink-0 accent-gold" />
      {children}
    </label>
  );
}

/** Rule fields for a "rules" collection. `rules` is the form's rules object; `onChange(key, value)`. */
export default function CollectionRules({ rules, categories = [], errors, onChange }) {
  const text = (key) => ({ id: fieldId(key), value: rules[key], error: errors[key], onChange: (event) => onChange(key, event.target.value) });
  const categoryOptions = [
    { value: "", label: t.anyCategory },
    ...categories.map((c) => ({ value: c.slug, label: c.is_visible ? c.name : t.hiddenName(c.name) })),
  ];
  // A rule can point at a category that was deleted since; keep it selectable so it isn't silently dropped.
  if (rules.category && !categories.some((c) => c.slug === rules.category)) {
    categoryOptions.push({ value: rules.category, label: rules.category });
  }

  return (
    <fieldset className="flex flex-col gap-4" aria-describedby={errors.rules ? fieldId("rules-error") : undefined}>
      <legend className="mb-1 text-small font-semibold text-fg">{t.title}</legend>
      <p className="text-small text-muted">{t.hint}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label={t.category} placeholder={null} options={categoryOptions} {...text("category")} />
        <Select label={t.gender} placeholder={null} options={[{ value: "", label: t.anyGender }, ...optionsOf(GENDER_RULES, t.genders)]} {...text("gender")} />
        <Select label={t.badge} placeholder={null} options={[{ value: "", label: t.anyBadge }, ...optionsOf(BADGE_RULES, t.badges)]} {...text("badge")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={t.priceMin} inputMode="numeric" {...text("priceMin")} />
        <Input label={t.priceMax} inputMode="numeric" {...text("priceMax")} />
      </div>
      <div className="flex flex-col">
        <Check id={fieldId("featured")} checked={rules.featured} onChange={(value) => onChange("featured", value)}>
          {t.featured}
        </Check>
        <Check id={fieldId("bestseller")} checked={rules.bestseller} onChange={(value) => onChange("bestseller", value)}>
          {t.bestseller}
        </Check>
      </div>
      {errors.rules && (
        <p id={fieldId("rules-error")} role="alert" className="text-small text-danger">
          {errors.rules}
        </p>
      )}
    </fieldset>
  );
}
