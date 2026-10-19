import { PRICE_RANGE } from "../../hooks/useListingParams";
import { formatTaka } from "../../lib/format";
import { strings } from "../../lib/strings";

const { min: LOW, max: HIGH, step: STEP } = PRICE_RANGE;
const pct = (value) => ((value - LOW) / (HIGH - LOW)) * 100;

// Dual slider: two native range inputs stacked on one track (keyboard + touch for free).
// Commits on release/keyboard change so the list doesn't refetch while dragging.
function PriceRange({ min = LOW, max = HIGH, onChange }) {
  const thumb =
    "pointer-events-none absolute inset-0 h-6 w-full appearance-none bg-transparent focus-visible:outline-none " +
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-pill [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand [&::-webkit-slider-thumb]:bg-raised " +
    "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-pill [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-brand [&::-moz-range-thumb]:bg-raised " +
    "focus-visible:[&::-webkit-slider-thumb]:outline focus-visible:[&::-webkit-slider-thumb]:outline-2 focus-visible:[&::-webkit-slider-thumb]:outline-offset-2 focus-visible:[&::-webkit-slider-thumb]:outline-focus " +
    "focus-visible:[&::-moz-range-thumb]:outline focus-visible:[&::-moz-range-thumb]:outline-2 focus-visible:[&::-moz-range-thumb]:outline-offset-2 focus-visible:[&::-moz-range-thumb]:outline-focus";

  // Remount per committed value (key) so the uncontrolled inputs follow URL changes (chips, clear).
  const commit = (nextMin, nextMax) => onChange({ min: nextMin <= LOW ? null : nextMin, max: nextMax >= HIGH ? null : nextMax });

  return (
    <div key={`${min}-${max}`}>
      <div className="relative h-6 px-2.5">
        <div className="absolute inset-x-2.5 top-1/2 h-1 -translate-y-1/2 rounded-pill bg-line" aria-hidden="true" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-pill bg-brand"
          style={{ left: `calc(10px + (100% - 20px) * ${pct(min) / 100})`, right: `calc(10px + (100% - 20px) * ${1 - pct(max) / 100})` }}
          aria-hidden="true"
        />
        <input
          type="range" min={LOW} max={HIGH} step={STEP} defaultValue={min}
          aria-label={strings.listing.filters.priceMin}
          aria-valuetext={formatTaka(min)}
          className={thumb}
          onChange={(e) => { if (Number(e.target.value) > max - STEP) e.target.value = max - STEP; }}
          onPointerUp={(e) => commit(Number(e.target.value), max)}
          onKeyUp={(e) => commit(Number(e.target.value), max)}
        />
        <input
          type="range" min={LOW} max={HIGH} step={STEP} defaultValue={max}
          aria-label={strings.listing.filters.priceMax}
          aria-valuetext={formatTaka(max)}
          className={thumb}
          onChange={(e) => { if (Number(e.target.value) < min + STEP) e.target.value = min + STEP; }}
          onPointerUp={(e) => commit(min, Number(e.target.value))}
          onKeyUp={(e) => commit(min, Number(e.target.value))}
        />
      </div>
      <p className="mt-3 flex justify-between text-small text-muted">
        <span>{formatTaka(min)}</span>
        <span>{formatTaka(max)}{max >= HIGH ? "+" : ""}</span>
      </p>
    </div>
  );
}

export default PriceRange;
