import { strings } from "../../lib/strings";

// Image-swatch picker (roadmap §6.4). The schema has one flat `variants`
// list per product (no separate "dial colour" / "strap" axis), so this
// renders a single row of swatches; variants without a `swatch_hex` fall
// back to a text chip.
function VariantPicker({ variants, selected, onSelect, name }) {
  if (!variants.length) return null;

  return (
    <div role="radiogroup" aria-label={strings.product.options}>
      <p className="text-small font-medium text-fg">{strings.product.options}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {variants.map((variant) => {
          const active = variant.id === selected?.id;
          const soldOut = variant.stock < 1;
          return (
            <button
              key={variant.id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${variant.name}${soldOut ? ` — ${strings.product.stock.out}` : ""}`}
              disabled={soldOut}
              onClick={() => onSelect(variant)}
              className={`flex h-11 items-center gap-2 rounded-control border px-3 text-small transition-[border-color,opacity] duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-40 ${
                active ? "border-brand" : "border-line hover:border-control"
              }`}
            >
              {variant.swatch_hex && (
                <span
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 rounded-full border border-line"
                  style={{ backgroundColor: variant.swatch_hex }}
                />
              )}
              <span className={soldOut ? "line-through" : ""}>{variant.name}</span>
            </button>
          );
        })}
      </div>
      <p className="sr-only" aria-live="polite">
        {selected ? strings.product.selected(`${name} — ${selected.name}`) : ""}
      </p>
    </div>
  );
}

export default VariantPicker;
