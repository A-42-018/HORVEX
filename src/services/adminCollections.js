import { query } from "./adminClient";
import { pathFromPublicUrl, removeFiles } from "./storage";

// Admin collections (roadmap §10). RLS hides collections outside their
// schedule window from the storefront, but admins see every row.
export const COLLECTION_BUCKET = "site-media";
export const COLLECTION_FOLDER = "collections";

const FIELDS =
  "id, slug, title, description, banner, mode, rules, active_from, active_to, is_visible, sort_order, collection_products(count)";

export async function listCollectionRows() {
  const rows = await query((db) => db.from("collections").select(FIELDS).order("sort_order").order("created_at"));
  return rows.map(({ collection_products, ...row }) => ({ ...row, productCount: collection_products?.[0]?.count ?? 0 }));
}

/** Hand-picked products of one collection, in order (drafts too: the admin session sees them). */
export async function listCollectionPicks(collectionId) {
  const rows = await query((db) =>
    db
      .from("collection_products")
      .select("sort_order, product:products (id, name, slug, status, price, images:product_images (url, is_lifestyle, sort_order))")
      .eq("collection_id", collectionId)
      .order("sort_order"),
  );
  return rows
    .filter((row) => row.product)
    .map(({ product: { images = [], ...product } }) => {
      const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
      return { ...product, thumb: sorted.find((image) => !image.is_lifestyle) ?? sorted[0] ?? null };
    });
}

/** Categories a rule can point at (the rule stores the slug). */
export const listRuleCategories = () =>
  query((db) => db.from("categories").select("id, slug, name, is_visible").order("sort_order"));

/** Largest sort_order + 1, so a new collection lands last. */
export async function nextCollectionSortOrder() {
  const rows = await query((db) =>
    db.from("collections").select("sort_order").order("sort_order", { ascending: false }).limit(1),
  );
  return (rows[0]?.sort_order ?? -1) + 1;
}

/** Replaces the hand-picked set: removes dropped products, upserts the rest with sort_order = position. */
export async function saveCollectionPicks(collectionId, productIds) {
  const existing = await query((db) => db.from("collection_products").select("product_id").eq("collection_id", collectionId));
  const dropped = existing.map((row) => row.product_id).filter((id) => !productIds.includes(id));
  if (dropped.length) {
    await query((db) => db.from("collection_products").delete().eq("collection_id", collectionId).in("product_id", dropped));
  }
  if (productIds.length) {
    await query((db) =>
      db.from("collection_products").upsert(
        productIds.map((product_id, sort_order) => ({ collection_id: collectionId, product_id, sort_order })),
        { onConflict: "collection_id,product_id" },
      ),
    );
  }
}

/** Best-effort delete of an uploaded banner file (seed/external URLs have none). */
export async function removeCollectionBannerFile(url) {
  const path = pathFromPublicUrl(COLLECTION_BUCKET, url);
  if (path) await removeFiles(COLLECTION_BUCKET, [path]).catch(() => {});
}
