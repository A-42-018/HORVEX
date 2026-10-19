import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button, Drawer } from "../common";
import { strings } from "../../lib/strings";
import FilterPanel from "./FilterPanel";

const t = strings.listing.filters;

const pick = (filters) => ({
  category: filters.category,
  gender: filters.gender,
  priceMin: filters.priceMin,
  priceMax: filters.priceMax,
  strap: filters.strap,
  movement: filters.movement,
  inStock: filters.inStock,
});

const countOf = (f) =>
  [f.category, f.gender, f.inStock].filter(Boolean).length +
  f.strap.length +
  f.movement.length +
  (f.priceMin != null || f.priceMax != null ? 1 : 0);

// URL-style keys (what FilterPanel sends) -> filters shape.
const KEY = { min: "priceMin", max: "priceMax", stock: "inStock" };

/**
 * Bottom-sheet filters below `lg`. Edits a draft copy of the URL filters; "Apply (n)" commits it
 * in one URL update and n is the live result count for the draft.
 * `useTotal(filters)` returns the result count for a filter object (page-specific query).
 */
function MobileFilters({ view, showCategory = false, useTotal }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => pick(view.filters));
  const total = useTotal({ ...draft });

  const openSheet = () => {
    setDraft(pick(view.filters));
    setOpen(true);
  };

  const draftView = {
    filters: draft,
    update: (changes) =>
      setDraft((prev) => {
        const next = { ...prev };
        for (const [key, value] of Object.entries(changes)) {
          next[KEY[key] ?? key] = value == null || value === "" ? undefined : key === "stock" ? true : value;
        }
        return next;
      }),
    toggle: (key, value) =>
      setDraft((prev) => ({
        ...prev,
        [key]: prev[key].includes(value) ? prev[key].filter((v) => v !== value) : [...prev[key], value],
      })),
  };

  const apply = () => {
    view.update({
      category: draft.category,
      gender: draft.gender,
      min: draft.priceMin,
      max: draft.priceMax,
      strap: draft.strap.join(","),
      movement: draft.movement.join(","),
      stock: draft.inStock ? 1 : null,
    });
    setOpen(false);
  };

  const clearDraft = () => setDraft({ strap: [], movement: [] });
  const count = countOf(draft);

  return (
    <>
      <Button variant="secondary" size="sm" className="lg:hidden" onClick={openSheet} aria-haspopup="dialog">
        <SlidersHorizontal aria-hidden="true" size={16} strokeWidth={1.5} />
        {view.activeCount ? t.buttonCount(view.activeCount) : t.title}
      </Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={t.title}
        tone="ivory"
        footer={
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={clearDraft} disabled={!count}>
              {t.reset}
            </Button>
            <Button className="flex-1" onClick={apply}>
              {total == null ? t.apply : t.applyCount(total)}
            </Button>
          </div>
        }
      >
        <FilterPanel view={draftView} showCategory={showCategory} />
      </Drawer>
    </>
  );
}

export default MobileFilters;
