// Pure helpers for the admin products list (filters run in the browser).

export const STATUSES = ["active", "draft", "archived"];
export const STOCK_FILTERS = ["in", "low", "out"];
export const SORTS = ["newest", "name", "priceAsc", "priceDesc", "stockAsc"];
export const NO_CATEGORY = "none";

/** "out" at 0, "low" at or below the product's own alert level, else "in". */
export function stockState(product) {
  if (product.stock <= 0) return "out";
  return product.stock <= product.low_stock_at ? "low" : "in";
}

const COMPARERS = {
  newest: (a, b) => new Date(b.created_at) - new Date(a.created_at),
  name: (a, b) => a.name.localeCompare(b.name),
  priceAsc: (a, b) => a.price - b.price,
  priceDesc: (a, b) => b.price - a.price,
  stockAsc: (a, b) => a.stock - b.stock || a.name.localeCompare(b.name),
};

export function filterProducts(items, { q = "", status = "", category = "", stock = "", sort = "newest" }) {
  const term = q.trim().toLowerCase();
  const compare = COMPARERS[sort] ?? COMPARERS.newest;
  return items
    .filter((product) => {
      if (status && product.status !== status) return false;
      if (category === NO_CATEGORY) {
        if (product.category) return false;
      } else if (category && product.category?.id !== category) {
        return false;
      }
      if (stock && stockState(product) !== stock) return false;
      if (term && !`${product.name} ${product.sku ?? ""}`.toLowerCase().includes(term)) return false;
      return true;
    })
    .sort(compare);
}

/** Categories that at least one product uses, A–Z, for the filter. */
export function categoryOptions(items) {
  const byId = new Map();
  for (const { category } of items) if (category) byId.set(category.id, category.name);
  return [...byId].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
}
