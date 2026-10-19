import { X } from "lucide-react";
import { useCategories } from "../../hooks/useCatalog";
import { formatTaka } from "../../lib/format";
import { strings } from "../../lib/strings";

const t = strings.listing.filters;

// Removable chips for every active filter, plus "Clear all".
function ActiveChips({ view, showCategory = false, showGender = true }) {
  const { filters, update, toggle, clear } = view;
  const categories = useCategories();
  const chips = [];

  if (filters.search) chips.push({ id: "search", label: t.searchChip(filters.search), remove: () => update({ search: null }) });
  if (showCategory && filters.category) {
    const name = categories.data?.find((c) => c.slug === filters.category)?.name ?? filters.category;
    chips.push({ id: "category", label: name, remove: () => update({ category: null }) });
  }
  if (showGender && filters.gender) chips.push({ id: "gender", label: t.genders[filters.gender], remove: () => update({ gender: null }) });
  if (filters.priceMin != null || filters.priceMax != null) {
    const label = t.priceChip(
      filters.priceMin != null ? formatTaka(filters.priceMin) : null,
      filters.priceMax != null ? formatTaka(filters.priceMax) : null,
    );
    chips.push({ id: "price", label, remove: () => update({ min: null, max: null }) });
  }
  filters.strap.forEach((key) => chips.push({ id: `strap-${key}`, label: `${t.straps[key]} ${t.strap.toLowerCase()}`, remove: () => toggle("strap", key) }));
  filters.movement.forEach((key) => chips.push({ id: `movement-${key}`, label: t.movements[key], remove: () => toggle("movement", key) }));
  if (filters.inStock) chips.push({ id: "stock", label: t.inStock, remove: () => update({ stock: null }) });

  if (!chips.length) return null;
  return (
    <ul aria-label={t.activeLabel} className="mb-6 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <li key={chip.id}>
          <button
            type="button"
            onClick={chip.remove}
            aria-label={t.remove(chip.label)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-pill border border-line bg-raised px-3 text-small text-fg hover:border-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {chip.label}
            <X aria-hidden="true" size={14} strokeWidth={1.5} />
          </button>
        </li>
      ))}
      <li>
        <button type="button" onClick={clear} className="min-h-11 px-2 text-small text-muted underline underline-offset-4 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
          {strings.listing.clearFilters}
        </button>
      </li>
    </ul>
  );
}

export default ActiveChips;
