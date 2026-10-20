import { query } from "./adminClient";
import { pathFromPublicUrl, removeFiles } from "./storage";

// Admin categories (roadmap §10). Hidden categories are visible to admins via
// RLS. The product count uses an embedded aggregate over `products.category_id`.
export const CATEGORY_BUCKET = "site-media";
export const CATEGORY_FOLDER = "categories";

const FIELDS = "id, slug, name, image, description, parent_id, sort_order, is_visible, products(count)";

export async function listCategoryRows() {
  const rows = await query((db) => db.from("categories").select(FIELDS).order("sort_order").order("created_at"));
  return rows.map(({ products, ...row }) => ({ ...row, productCount: products?.[0]?.count ?? 0 }));
}

/** Largest sort_order + 1, so a new category lands last. */
export async function nextCategorySortOrder() {
  const rows = await query((db) =>
    db.from("categories").select("sort_order").order("sort_order", { ascending: false }).limit(1),
  );
  return (rows[0]?.sort_order ?? -1) + 1;
}

/** Best-effort delete of an uploaded image file (seed/external URLs have none). */
export async function removeCategoryImageFile(url) {
  const path = pathFromPublicUrl(CATEGORY_BUCKET, url);
  if (path) await removeFiles(CATEGORY_BUCKET, [path]).catch(() => {});
}
