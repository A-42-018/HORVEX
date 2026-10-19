import { query, queryWithCount } from "./supabase";

// Catalog reads. RLS already hides drafts/archived products and their images
// and variants, so the storefront never filters on status itself.

const CARD_FIELDS = `
  id, slug, name, gender, price, compare_at_price, stock, low_stock_at, badges,
  is_featured, is_bestseller, sort_order, created_at,
  images:product_images (id, url, alt, is_lifestyle, sort_order),
  variants:product_variants (id, name, price_override, stock, swatch_hex, image_id, sort_order)`;

const DETAIL_FIELDS = `${CARD_FIELDS},
  sku, short_desc, description, specs, seo_title, seo_desc`;

const SORTS = {
  featured: [["sort_order", true]],
  newest: [["created_at", false], ["sort_order", true]],
  "price-asc": [["price", true], ["sort_order", true]],
  "price-desc": [["price", false], ["sort_order", true]],
  bestselling: [["is_bestseller", false], ["sort_order", true]],
};
export const PRODUCT_SORTS = Object.keys(SORTS);

// Strap / movement are free text in `specs`, so each option maps to ILIKE patterns.
export const FILTER_OPTIONS = {
  strap: {
    chain: ["%bracelet%", "%chain%"],
    leather: ["%leather%"],
    silicone: ["%silicone%"],
    mesh: ["%mesh%"],
  },
  movement: {
    quartz: ["%quartz%"],
    chronograph: ["%chronograph%"],
    automatic: ["%automatic%"],
  },
};

function specClause(field, keys = []) {
  const patterns = keys.flatMap((key) => FILTER_OPTIONS[field][key] ?? []);
  return patterns.map((pattern) => `specs->>${field}.ilike.${pattern}`).join(",");
}

// "men" / "women" are gender landing categories: no product has them as category_id, so their
// listings filter on products.gender (which also includes unisex) instead of the category slug.
export const GENDER_CATEGORIES = ["men", "women"];
export const categoryScope = (slug) => (GENDER_CATEGORIES.includes(slug) ? { gender: slug } : { category: slug });

const bySortOrder = (a, b) => a.sort_order - b.sort_order;

/** Embedded rows come back unordered; sort them once here so components don't. */
function normalize(product) {
  return {
    ...product,
    images: [...(product.images ?? [])].sort(bySortOrder),
    variants: [...(product.variants ?? [])].sort(bySortOrder),
  };
}

// `%` and `_` are ILIKE wildcards; commas/parens would break PostgREST filter syntax.
const escapeSearch = (term) => term.replace(/[\\%_]/g, "\\$&").replace(/[(),]/g, " ").trim();

/**
 * Product listing.
 * filters: { category, gender, featured, bestseller, onSale, badge, priceMin, priceMax,
 *            strap, movement, inStock, search, ids, sort, limit, offset }
 * `strap` / `movement` are arrays of FILTER_OPTIONS keys (OR within a facet, AND across facets).
 * `onSale` = has a compare-at price (the seed/admin only set it on discounted pieces).
 * `gender` also includes unisex pieces. Returns { items, total }.
 */
export async function listProducts(filters = {}) {
  const { category, gender, featured, bestseller, onSale, badge, priceMin, priceMax, search, ids } = filters;
  const { strap, movement, inStock } = filters;
  const { sort = "featured", limit = 24, offset = 0 } = filters;

  // An inner join lets us filter on the category's slug in one request.
  const categoryJoin = category ? "category:categories!inner (slug, name)" : "category:categories (slug, name)";

  const { data, count } = await queryWithCount((db) => {
    let q = db.from("products").select(`${CARD_FIELDS}, ${categoryJoin}`, { count: "exact" });
    if (category) q = q.eq("category.slug", category);
    if (gender) q = q.in("gender", [gender, "unisex"]);
    if (featured) q = q.eq("is_featured", true);
    if (bestseller) q = q.eq("is_bestseller", true);
    if (onSale) q = q.not("compare_at_price", "is", null);
    if (badge) q = q.contains("badges", [badge]);
    if (priceMin != null) q = q.gte("price", priceMin);
    if (priceMax != null) q = q.lte("price", priceMax);
    if (inStock) q = q.gt("stock", 0);
    for (const [field, keys] of [["strap", strap], ["movement", movement]]) {
      const clause = specClause(field, keys);
      if (clause) q = q.or(clause);
    }
    if (search?.trim()) q = q.ilike("name", `%${escapeSearch(search)}%`);
    if (ids) q = q.in("id", ids);
    for (const [column, ascending] of SORTS[sort] ?? SORTS.featured) q = q.order(column, { ascending });
    return q.range(offset, offset + limit - 1);
  });

  return { items: data.map(normalize), total: count ?? data.length };
}

const SEARCH_FIELDS = `
  id, slug, name, price, compare_at_price, stock, sort_order,
  category:categories (name),
  images:product_images (id, url, alt, is_lifestyle, sort_order)`;

export const SEARCH_MIN_CHARS = 2;

/** Lean name search for the instant-results overlay. Returns { items, total }; empty below the minimum length. */
export async function searchProducts(term, limit = 6) {
  const clean = escapeSearch(term ?? "");
  if (clean.length < SEARCH_MIN_CHARS) return { items: [], total: 0 };
  const { data, count } = await queryWithCount((db) =>
    db
      .from("products")
      .select(SEARCH_FIELDS, { count: "exact" })
      .ilike("name", `%${clean}%`)
      .order("sort_order", { ascending: true })
      .range(0, limit - 1),
  );
  return { items: data.map(normalize), total: count ?? data.length };
}

/** Full product for the PDP, or null when it doesn't exist or isn't active. */
export async function getProduct(slug) {
  const row = await query((db) =>
    db
      .from("products")
      .select(`${DETAIL_FIELDS}, category:categories (id, slug, name)`)
      .eq("slug", slug)
      .maybeSingle(),
  );
  return row && normalize(row);
}

/** Cards for a list of ids (wishlist, recently viewed), returned in the given order. */
export async function getProductsByIds(ids) {
  if (!ids.length) return [];
  const { items } = await listProducts({ ids, limit: ids.length });
  const byId = new Map(items.map((p) => [p.id, p]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

/** Approved reviews for one product, newest first. */
export function listProductReviews(productId) {
  return query((db) =>
    db
      .from("reviews")
      .select("id, name, rating, text, photo_url, created_at")
      .eq("product_id", productId)
      .order("created_at", { ascending: false }),
  );
}

/** { average, count } from a list of reviews; average is rounded to one decimal. */
export function summarizeRatings(reviews = []) {
  if (!reviews.length) return { average: 0, count: 0 };
  const sum = reviews.reduce((total, r) => total + r.rating, 0);
  return { average: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length };
}
