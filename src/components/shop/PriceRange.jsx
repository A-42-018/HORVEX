import { useState } from "react";
import { PRICE_RANGE } from "../../hooks/useListingParams";
import { formatTaka } from "../../lib/format";
import { strings } from "../../lib/strings";

const { min: LOW, max: HIGH, step: STEP } = PRICE_RANGE;
const pct = (value) => ((value - LOW) / (HIGH - LOW)) * 100;

// Keys that move a native range input; Tab/Shift keyups must not commit (that resets the page).
const STEP_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"]);

// Dual slider: two native range inputs stacked on one track (keyboard + touch for free).
// Local controlled state follows drags; commits on pointer release or a stepping key, so the list
// doesn't refetch mid-drag and the inputs never remount (focus stays put across arrow presses).
function PriceRange({ min = LOW, max = HIGH, onChange }) {
  const [value, setValue] = useState({ min, max });
  const [synced, setSynced] = useState({ min, max });
  // Follow URL changes (chips, clear, mobile reset) by adjusting state during render.
  if (synced.min !== min || synced.max !== max) {
    setSynced({ min, max });
    setValue({ min, max });
  }

  const thumb =
    "pointer-events-none absolute inset-0 h-6 w-full appearance-none bg-transparent focus-visible:outline-none " +
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-pill [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand [&::-webkit-slider-thumb]:bg-raised " +
    "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-pill [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-brand [&::-moz-range-thumb]:bg-raised " +
    "focus-visible:[&::-webkit-slider-thumb]:outline focus-visible:[&::-webkit-slider-thumb]:outline-2 focus-visible:[&::-webkit-slider-thumb]:outline-offset-2 focus-visible:[&::-webkit-slider-thumb]:outline-focus " +
    "focus-visible:[&::-moz-range-thumb]:outline focus-visible:[&::-moz-range-thumb]:outline-2 focus-visible:[&::-moz-range-thumb]:outline-offset-2 focus-visible:[&::-moz-range-thumb]:outline-focus";

  const commit = (next) => {
    if (next.min === min && next.max === max) return;
    onChange({ min: next.min <= LOW ? null : next.min, max: next.max >= HIGH ? null : next.max });
  };
  const setLow = (raw) => setValue((v) => ({ ...v, min: Math.min(Number(raw), v.max - STEP) }));
  const setHigh = (raw) => setValue((v) => ({ ...v, max: Math.max(Number(raw), v.min + STEP) }));
  const onKeyUp = (e) => STEP_KEYS.has(e.key) && commit(value);

  return (
    <div>
      <div className="relative h-6 px-2.5">
        <div className="absolute inset-x-2.5 top-1/2 h-1 -translate-y-1/2 rounded-pill bg-line" aria-hidden="true" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-pill bg-brand"
          style={{ left: `calc(10px + (100% - 20px) * ${pct(value.min) / 100})`, right: `calc(10px + (100% - 20px) * ${1 - pct(value.max) / 100})` }}
          aria-hidden="true"
        />
        <input
          type="range" min={LOW} max={HIGH} step={STEP} value={value.min}
          aria-label={strings.listing.filters.priceMin}
          aria-valuetext={formatTaka(value.min)}
          className={thumb}
          onChange={(e) => setLow(e.target.value)}
          onPointerUp={() => commit(value)}
          onKeyUp={onKeyUp}
        />
        <input
          type="range" min={LOW} max={HIGH} step={STEP} value={value.max}
          aria-label={strings.listing.filters.priceMax}
          aria-valuetext={formatTaka(value.max)}
          className={thumb}
          onChange={(e) => setHigh(e.target.value)}
          onPointerUp={() => commit(value)}
          onKeyUp={onKeyUp}
        />
      </div>
      <p className="mt-3 flex justify-between text-small text-muted">
        <span>{formatTaka(value.min)}</span>
        <span>{formatTaka(value.max)}{value.max >= HIGH ? "+" : ""}</span>
      </p>
    </div>
  );
}

export default PriceRange;
