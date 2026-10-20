import { Card, Input, Select } from "../../../components/common";
import { strings } from "../../../lib/strings";
import ProductImages from "./ProductImages";
import ProductVariants from "./ProductVariants";
import QuickToggle from "./QuickToggle";
import { BADGES, GENDERS, LIMITS, SPEC_KEYS, STATUS_OPTIONS, fieldId } from "./productForm";

const t = strings.admin.productEditor;

function Section({ id, title, children, className = "" }) {
  const headingId = `pe-section-${id}`;
  return (
    <Card as="section" aria-labelledby={headingId} className={`flex flex-col gap-4 p-5 sm:p-6 ${className}`}>
      <h2 id={headingId} className="text-body font-semibold text-fg">
        {title}
      </h2>
      {children}
    </Card>
  );
}

const optionsOf = (keys, labels) => keys.map((value) => ({ value, label: labels[value] }));

/** Left column: the product's own content. */
export function MainFields({ form, errors, set, setSpec, isNew, categories, variantCount, onSlugEdit }) {
  const field = (key, extra = {}) => ({
    id: fieldId(key),
    value: form[key],
    error: errors[key],
    onChange: (event) => set(key, event.target.value),
    ...extra,
  });
  const numeric = { type: "text", inputMode: "numeric", autoComplete: "off" };

  return (
    <>
      <Section id="basics" title={t.sections.basics}>
        <Input label={t.fields.name} maxLength={LIMITS.name + 20} {...field("name")} />
        <Input
          label={t.fields.slug}
          autoCapitalize="none"
          spellCheck={false}
          hint={isNew ? t.hints.slugNew : t.hints.slug}
          {...field("slug", { onChange: (event) => onSlugEdit(event.target.value) })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t.fields.sku} hint={t.hints.sku} optional {...field("sku")} />
          <Select
            label={t.fields.gender}
            placeholder={null}
            options={optionsOf(GENDERS, t.genders)}
            {...field("gender")}
          />
        </div>
        <Select
          label={t.fields.category}
          placeholder={null}
          options={[{ value: "", label: t.fields.noCategory }, ...categories]}
          {...field("categoryId")}
        />
      </Section>

      <Section id="pricing" title={t.sections.pricing}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label={t.fields.price} {...numeric} {...field("price")} />
          <Input label={t.fields.compareAt} hint={t.hints.compareAt} optional {...numeric} {...field("compareAtPrice")} />
          <Input label={t.fields.cost} hint={t.hints.cost} optional {...numeric} {...field("costPrice")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t.fields.stock}
            hint={variantCount > 0 ? t.hints.stockVariants(variantCount) : t.hints.stock}
            {...numeric}
            {...field("stock")}
          />
          <Input label={t.fields.lowStockAt} hint={t.hints.lowStockAt} {...numeric} {...field("lowStockAt")} />
        </div>
      </Section>

      <Section id="description" title={t.sections.description}>
        <Input
          label={t.fields.shortDesc}
          optional
          hint={t.hints.shortDesc(form.shortDesc.trim().length, LIMITS.shortDesc)}
          {...field("shortDesc")}
        />
        <Input
          label={t.fields.description}
          optional
          multiline
          hint={t.hints.description}
          rows={8}
          {...field("description")}
        />
      </Section>

      <Section id="specs" title={t.sections.specs}>
        <div className="grid gap-4 sm:grid-cols-2">
          {SPEC_KEYS.filter((key) => key !== "box_contents").map((key) => (
            <Input
              key={key}
              id={fieldId(`specs.${key}`)}
              label={t.specLabels[key]}
              optional
              hint={t.hints[key]}
              value={form.specs[key]}
              error={errors[`specs.${key}`]}
              onChange={(event) => setSpec(key, event.target.value)}
            />
          ))}
        </div>
        <Input
          id={fieldId("specs.box_contents")}
          label={t.specLabels.box_contents}
          optional
          multiline
          rows={3}
          hint={t.hints.box}
          value={form.specs.box_contents}
          error={errors["specs.box_contents"]}
          onChange={(event) => setSpec("box_contents", event.target.value)}
          className="[&_textarea]:min-h-24"
        />
      </Section>

      <Section id="seo" title={t.sections.seo}>
        <Input
          label={t.fields.seoTitle}
          optional
          hint={t.hints.seoTitle(form.seoTitle.trim().length, LIMITS.seoTitle)}
          {...field("seoTitle")}
        />
        <Input
          label={t.fields.seoDesc}
          optional
          multiline
          rows={3}
          hint={t.hints.seoDesc(form.seoDesc.trim().length, LIMITS.seoDesc)}
          className="[&_textarea]:min-h-24"
          {...field("seoDesc")}
        />
      </Section>
    </>
  );
}

/** Images and variants. Rendered outside the editor <form>: variant rows are forms of their own, and forms can't nest. */
export function MediaFields({ isNew, productId }) {
  return (
    <>
      <Section id="media" title={t.sections.media}>
        {isNew ? <p className="text-small text-muted">{t.hints.imagesNew}</p> : <ProductImages productId={productId} />}
      </Section>

      <Section id="variants" title={strings.admin.productEditor.variants.title}>
        <ProductVariants productId={isNew ? null : productId} />
      </Section>
    </>
  );
}

const STATUS_NOTE = { draft: "draftNote", active: "activeNote", archived: "archivedNote" };

/** Right column: publishing, visibility, badges. */
export function SideFields({ form, errors, set, toggleBadge }) {
  const name = form.name.trim() || t.titleNew;

  return (
    <>
      <Section id="publish" title={t.sections.publish}>
        <Select
          label={t.fields.status}
          placeholder={null}
          options={optionsOf(STATUS_OPTIONS, t.statuses)}
          id={fieldId("status")}
          value={form.status}
          onChange={(event) => set("status", event.target.value)}
        />
        <p className="text-small text-muted">{t.hints[STATUS_NOTE[form.status]]}</p>
      </Section>

      <Section id="visibility" title={t.sections.visibility}>
        <div className="flex flex-col">
          <QuickToggle
            showLabel
            label={t.fields.featured}
            name={name}
            checked={form.isFeatured}
            onChange={(value) => set("isFeatured", value)}
          />
          <QuickToggle
            showLabel
            label={t.fields.bestseller}
            name={name}
            checked={form.isBestseller}
            onChange={(value) => set("isBestseller", value)}
          />
        </div>
        <Input
          label={t.fields.sortOrder}
          hint={t.hints.sortOrder}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          id={fieldId("sortOrder")}
          value={form.sortOrder}
          error={errors.sortOrder}
          onChange={(event) => set("sortOrder", event.target.value)}
        />
      </Section>

      <Section id="badges" title={t.sections.badges}>
        <div className="flex flex-col">
          {BADGES.map((badge) => (
            <QuickToggle
              key={badge}
              showLabel
              label={t.badgeLabels[badge]}
              name={name}
              checked={form.badges.includes(badge)}
              onChange={() => toggleBadge(badge)}
            />
          ))}
        </div>
      </Section>
    </>
  );
}
