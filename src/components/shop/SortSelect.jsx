import { PRODUCT_SORTS } from "../../services/products";
import { strings } from "../../lib/strings";

// Compact native select; "featured" is the default when no sort is in the URL.
function SortSelect({ value = "featured", onChange }) {
  return (
    <label className="flex items-center gap-3 text-small text-muted">
      <span className="whitespace-nowrap">{strings.listing.sortLabel}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 cursor-pointer rounded-control border border-control bg-raised px-3 text-small text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        {PRODUCT_SORTS.map((key) => (
          <option key={key} value={key}>
            {strings.listing.sorts[key]}
          </option>
        ))}
      </select>
    </label>
  );
}

export default SortSelect;
