import { useCategories } from "../../hooks/useCatalog";
import { PRICE_RANGE } from "../../hooks/useListingParams";
import { FILTER_OPTIONS } from "../../services/products";
import { strings } from "../../lib/strings";
import PriceRange from "./PriceRange";

const t = strings.listing.filters;
const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

function Group({ title, children }) {
  return (
    <fieldset className="border-b border-line py-5 first:pt-0 last:border-b-0">
      <legend className="mb-3 text-eyebrow text-muted">{title}</legend>
      {children}
    </fieldset>
  );
}

function Check({ type = "checkbox", name, checked, onChange, children }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-small text-fg">
      <input type={type} name={name} checked={checked} onChange={onChange} className={`h-4 w-4 accent-brand ${focus}`} />
      {children}
    </label>
  );
}

/**
 * Filter controls, driven by `useListingParams()` (`view`). Shared by the desktop sidebar (B13a)
 * and the mobile sheet (B13b). `showCategory` is off on category/collection pages.
 */
function FilterPanel({ view, showCategory = false }) {
  const { filters, update, toggle } = view;
  const categories = useCategories();
  const topLevel = (categories.data ?? []).filter((c) => !c.parent_id);

  return (
    <div role="group" aria-label={t.label}>
      {showCategory && topLevel.length > 0 && (
        <Group title={t.category}>
          <Check type="radio" name="filter-category" checked={!filters.category} onChange={() => update({ category: null })}>
            {strings.listing.shop}
          </Check>
          {topLevel.map((c) => (
            <Check key={c.slug} type="radio" name="filter-category" checked={filters.category === c.slug} onChange={() => update({ category: c.slug })}>
              {c.name}
            </Check>
          ))}
        </Group>
      )}
      <Group title={t.gender}>
        {Object.keys(t.genders).map((key) => (
          <Check key={key} checked={filters.gender === key} onChange={() => update({ gender: filters.gender === key ? null : key })}>
            {t.genders[key]}
          </Check>
        ))}
      </Group>
      <Group title={t.price}>
        <PriceRange
          min={filters.priceMin ?? PRICE_RANGE.min}
          max={filters.priceMax ?? PRICE_RANGE.max}
          onChange={({ min, max }) => update({ min, max })}
        />
      </Group>
      <Group title={t.strap}>
        {Object.keys(FILTER_OPTIONS.strap).map((key) => (
          <Check key={key} checked={filters.strap.includes(key)} onChange={() => toggle("strap", key)}>
            {t.straps[key]}
          </Check>
        ))}
      </Group>
      <Group title={t.movement}>
        {Object.keys(FILTER_OPTIONS.movement).map((key) => (
          <Check key={key} checked={filters.movement.includes(key)} onChange={() => toggle("movement", key)}>
            {t.movements[key]}
          </Check>
        ))}
      </Group>
      <Group title={t.availability}>
        <Check checked={Boolean(filters.inStock)} onChange={() => update({ stock: filters.inStock ? null : 1 })}>
          {t.inStock}
        </Check>
      </Group>
    </div>
  );
}

export default FilterPanel;
