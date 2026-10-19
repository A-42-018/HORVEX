import { useCallback } from "react";
import { useSearchParams } from "react-router";
import { FILTER_OPTIONS, PRODUCT_SORTS } from "../services/products";

export const PAGE_SIZE = 24;
const MAX_PAGES = 20;
export const PRICE_RANGE = { min: 0, max: 12000, step: 500 };
const GENDERS = ["men", "women", "unisex"];
const FILTER_KEYS = ["category", "gender", "min", "max", "strap", "movement", "stock", "search"];
const SEARCH_MAX = 64;

const list = (raw, field) =>
  (raw ?? "").split(",").filter((key, i, all) => key in FILTER_OPTIONS[field] && all.indexOf(key) === i);
const price = (raw) => {
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, PRICE_RANGE.min), PRICE_RANGE.max) : undefined;
};

/**
 * Listing view state kept in the URL (?sort=price-asc&page=2) so links can be shared.
 * `sort` is undefined when absent/invalid (collections then keep their hand-picked order).
 * Filters (?category=&gender=&min=&max=&strap=a,b&movement=a,b&stock=1&search=) are parsed into `filters`
 * (the shape `listProducts` takes); any filter change resets `page`. `search` (from the search
 * overlay's "View all") is a chip but not a panel filter, so it isn't in `activeCount`.
 * `page` = how many pages are shown (load more appends, so the view is reproducible).
 */
export function useListingParams() {
  const [params, setParams] = useSearchParams();

  const rawSort = params.get("sort");
  const sort = PRODUCT_SORTS.includes(rawSort) ? rawSort : undefined;
  const rawPage = Number.parseInt(params.get("page") ?? "1", 10);
  const page = Number.isFinite(rawPage) ? Math.min(Math.max(rawPage, 1), MAX_PAGES) : 1;

  const rawGender = params.get("gender");
  const priceMin = price(params.get("min"));
  const priceMax = price(params.get("max"));
  const filters = {
    category: params.get("category") || undefined,
    gender: GENDERS.includes(rawGender) ? rawGender : undefined,
    priceMin: priceMin > PRICE_RANGE.min ? priceMin : undefined,
    priceMax: priceMax < PRICE_RANGE.max ? priceMax : undefined,
    strap: list(params.get("strap"), "strap"),
    movement: list(params.get("movement"), "movement"),
    inStock: params.get("stock") === "1" || undefined,
    search: params.get("search")?.trim().slice(0, SEARCH_MAX) || undefined,
  };
  const activeCount =
    [filters.category, filters.gender, filters.inStock].filter(Boolean).length +
    filters.strap.length +
    filters.movement.length +
    (filters.priceMin != null || filters.priceMax != null ? 1 : 0);

  const update = useCallback(
    (changes) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(changes)) {
            if (value == null || value === "") next.delete(key);
            else next.set(key, String(value));
          }
          return next;
        },
        { replace: true, preventScrollReset: true },
      ),
    [setParams],
  );

  return {
    sort,
    page,
    limit: page * PAGE_SIZE,
    filters,
    activeCount,
    hasFilters: activeCount > 0 || Boolean(filters.search),
    update: (changes) => update({ ...changes, page: null }),
    /** Toggle one key of a comma-list param (strap, movement). */
    toggle: (key, value) => {
      const current = filters[key] ?? [];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      update({ [key]: next.join(","), page: null });
    },
    setSort: (value) => update({ sort: value === "featured" ? null : value, page: null }),
    loadMore: () => update({ page: page + 1 }),
    clear: () => update(Object.fromEntries([...FILTER_KEYS, "page"].map((key) => [key, null]))),
  };
}
