import { query } from "./supabase";
import { listProducts } from "./products";

// Categories and collections. RLS hides hidden categories and collections
// outside their active window.

export function listCategories() {
  return query((db) =>
    db
      .from("categories")
      .select("id, slug, name, image, description, parent_id, sort_order")
      .order("sort_order"),
  );
}

export function getCategory(slug) {
  return query((db) =>
    db.from("categories").select("id, slug, name, image, description, parent_id").eq("slug", slug).maybeSingle(),
  );
}

export function listCollections() {
  return query((db) =>
    db.from("collections").select("id, slug, title, description, banner, mode, rules, sort_order").order("sort_order"),
  );
}

export function getCollection(slug) {
  return query((db) =>
    db
      .from("collections")
      .select("id, slug, title, description, banner, mode, rules, active_to")
      .eq("slug", slug)
      .maybeSingle(),
  );
}

// Rule keys an admin can set on a "rules" collection → listProducts filters.
const RULE_FILTERS = {
  price_min: "priceMin",
  price_max: "priceMax",
  category: "category",
  gender: "gender",
  badge: "badge",
  featured: "featured",
  bestseller: "bestseller",
};

export function collectionFilters(rules = {}) {
  return Object.fromEntries(
    Object.entries(rules)
      .filter(([key]) => key in RULE_FILTERS)
      .map(([key, value]) => [RULE_FILTERS[key], value]),
  );
}

/** Products in a collection: hand-picked order for "manual", the rules for "rules". */
export async function listCollectionProducts(collection, { sort, limit = 24, offset = 0, filters = {} } = {}) {
  if (collection.mode === "rules") {
    return listProducts({ ...collectionFilters(collection.rules), ...filters, sort, limit, offset });
  }
  const links = await query((db) =>
    db.from("collection_products").select("product_id").eq("collection_id", collection.id).order("sort_order"),
  );
  const ids = links.map((l) => l.product_id);
  if (!ids.length) return { items: [], total: 0 };
  const { items } = await listProducts({ ...filters, ids, limit: ids.length, sort });
  // Without an explicit sort, keep the admin's hand-picked order.
  const ordered = sort ? items : ids.map((id) => items.find((p) => p.id === id)).filter(Boolean);
  return { items: ordered.slice(offset, offset + limit), total: ordered.length };
}
