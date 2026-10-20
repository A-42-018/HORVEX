import { query } from "./adminClient";
import { reorderRows } from "./admin";
import { listFiles, pathFromPublicUrl, removeFiles } from "./storage";
import { removeReviewPhoto } from "./adminReviews";

// Admin product list (roadmap §10). One lean read of the whole catalog: a
// watch store has tens to a few hundred products, so search, filters and sort
// run in the browser (exact low-stock logic needs `stock <= low_stock_at`,
// which a PostgREST filter can't express). RLS lets any admin see drafts.
const LIST_FIELDS = `
  id, slug, name, sku, status, price, compare_at_price, stock, low_stock_at,
  is_featured, is_bestseller, created_at, updated_at,
  category:categories (id, name),
  images:product_images (id, url, alt, is_lifestyle, sort_order),
  variants:product_variants (id, stock)`;

const MAX_ROWS = 1000;

// Studio shot first (like the storefront card), then the first image.
function pickThumb(images = []) {
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  return sorted.find((image) => !image.is_lifestyle) ?? sorted[0] ?? null;
}

export async function listAdminProducts() {
  const rows = await query((db) =>
    db.from("products").select(LIST_FIELDS).order("created_at", { ascending: false }).limit(MAX_ROWS),
  );
  return {
    items: rows.map(({ images, variants, ...product }) => ({
      ...product,
      // With variants, the store sells the variants' stock (as the dashboard and PDP do).
      stock: variants?.length ? variants.reduce((sum, variant) => sum + variant.stock, 0) : product.stock,
      thumb: pickThumb(images),
      imageCount: images?.length ?? 0,
      variantCount: variants?.length ?? 0,
    })),
    truncated: rows.length >= MAX_ROWS,
  };
}

// ---------------------------------------------------------------------------
// Product editor (B22b)
// ---------------------------------------------------------------------------

/** One product for the editor, with its cost (admin-only table) and child counts. Null when not found. */
export async function getAdminProduct(id) {
  const row = await query((db) =>
    db
      .from("products")
      .select("*, cost:product_costs (cost_price), images:product_images (id), variants:product_variants (id)")
      .eq("id", id)
      .maybeSingle(),
  );
  if (!row) return null;
  const { cost, images, variants, ...product } = row;
  const costRow = Array.isArray(cost) ? cost[0] : cost; // one-to-one embeds as an object
  return {
    product,
    costPrice: costRow?.cost_price ?? null,
    imageCount: images?.length ?? 0,
    variantCount: variants?.length ?? 0,
  };
}

/** Every category (hidden ones too) for the category picker. */
export const listAdminCategories = () =>
  query((db) => db.from("categories").select("id, name, parent_id, is_visible, sort_order").order("sort_order"));

/** Sets the cost price; null removes the row. */
export const saveProductCost = (productId, costPrice) =>
  costPrice == null
    ? query((db) => db.from("product_costs").delete().eq("product_id", productId))
    : query((db) => db.from("product_costs").upsert({ product_id: productId, cost_price: costPrice }, { onConflict: "product_id" }));

// First free "<base>-copy", "<base>-copy-2", … among existing slugs.
async function freeCopySlug(base) {
  const stem = `${base}-copy`;
  const rows = await query((db) => db.from("products").select("slug").like("slug", `${stem}%`));
  const taken = new Set(rows.map((row) => row.slug));
  if (!taken.has(stem)) return stem;
  for (let n = 2; n < 1000; n += 1) if (!taken.has(`${stem}-${n}`)) return `${stem}-${n}`;
  return `${stem}-${Date.now()}`;
}

/**
 * Copies a product as a new draft: same fields and cost, name "… (copy)", a
 * fresh slug, no SKU (SKUs are unique), not featured / best seller.
 * Images and variants are NOT copied (B23).
 */
export async function duplicateAdminProduct(id) {
  const source = await getAdminProduct(id);
  if (!source) throw new Error("not_found");
  const fields = { ...source.product };
  delete fields.id;
  delete fields.created_at;
  delete fields.updated_at;
  const slug = await freeCopySlug(fields.slug);
  const copy = await query((db) =>
    db
      .from("products")
      .insert({
        ...fields,
        name: `${fields.name} (copy)`,
        slug,
        sku: null,
        status: "draft",
        is_featured: false,
        is_bestseller: false,
      })
      .select()
      .single(),
  );
  if (source.costPrice != null) await saveProductCost(copy.id, source.costPrice);
  return { copy, source: source.product };
}

// ---------------------------------------------------------------------------
// Product images (B23a)
// ---------------------------------------------------------------------------

export const IMAGE_BUCKET = "product-images";

/** A product's images in storefront order (sort_order, then upload time). */
export const listProductImages = (productId) =>
  query((db) =>
    db
      .from("product_images")
      .select("id, url, alt, is_lifestyle, sort_order, created_at")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  );

/** Saves an uploaded file as the product's last image. */
export const addProductImage = ({ productId, url, alt = "", sortOrder }) =>
  query((db) =>
    db
      .from("product_images")
      .insert({ product_id: productId, url, alt, sort_order: sortOrder })
      .select("id, url, alt, is_lifestyle, sort_order, created_at")
      .single(),
  );

/** Writes sort_order = position for the given image ids. */
export const reorderProductImages = (ids) => reorderRows("product_images", ids);

/**
 * Removes the row, then its file. A file we can't remove (or an external seed
 * URL) is left alone: the product is already clean, so it only costs storage.
 */
export async function deleteProductImage(image) {
  await query((db) => db.from("product_images").delete().eq("id", image.id));
  const path = pathFromPublicUrl(IMAGE_BUCKET, image.url);
  if (path) await removeFiles(IMAGE_BUCKET, [path]).catch(() => {});
}

// ---------------------------------------------------------------------------
// Product variants (B23b)
// ---------------------------------------------------------------------------

const VARIANT_FIELDS = "id, product_id, name, sku, price_override, stock, swatch_hex, image_id, sort_order, created_at";

/** A product's variants in storefront order. */
export const listProductVariants = (productId) =>
  query((db) =>
    db
      .from("product_variants")
      .select(VARIANT_FIELDS)
      .eq("product_id", productId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  );

/** Adds a variant at the end of the list. `values` are DB columns. */
export const addProductVariant = ({ productId, values, sortOrder }) =>
  query((db) =>
    db
      .from("product_variants")
      .insert({ ...values, product_id: productId, sort_order: sortOrder })
      .select(VARIANT_FIELDS)
      .single(),
  );

/** Writes sort_order = position for the given variant ids. */
export const reorderProductVariants = (ids) => reorderRows("product_variants", ids);

// ---------------------------------------------------------------------------
// Removing products (C6a)
// ---------------------------------------------------------------------------

/** Ids of the given products that appear in at least one order (any status). */
export async function productsInOrders(ids) {
  if (!ids.length) return [];
  const rows = await query((db) => db.from("order_items").select("product_id").in("product_id", ids));
  return [...new Set(rows.map((row) => row.product_id))];
}

// Best-effort: the rows are already gone, a leftover file only costs storage.
async function removeProductFiles(ids, imageUrls, reviewPhotos) {
  const paths = new Set(imageUrls.map((url) => pathFromPublicUrl(IMAGE_BUCKET, url)).filter(Boolean));
  // Uploads live in a folder named after the product; this also catches orphans.
  const folders = await Promise.all(ids.map((id) => listFiles(IMAGE_BUCKET, id).catch(() => [])));
  folders.flat().forEach((path) => paths.add(path));
  if (paths.size) await removeFiles(IMAGE_BUCKET, [...paths]).catch(() => {});
  await Promise.all(reviewPhotos.map((url) => removeReviewPhoto(url).catch(() => {})));
}

/**
 * Removes products safely. A product that appears in any order is archived
 * (hidden from the store, row kept so order records and reports stay whole);
 * the rest are deleted with their images, variants, reviews, collection links
 * and cost (FK cascades), then their files. Returns `{ deleted, archived }` ids.
 */
export async function removeAdminProducts(ids) {
  const inOrders = new Set(await productsInOrders(ids));
  const archiveIds = ids.filter((id) => inOrders.has(id));
  const deleteIds = ids.filter((id) => !inOrders.has(id));

  let archived = [];
  if (archiveIds.length) {
    const rows = await query((db) =>
      db
        .from("products")
        .update({ status: "archived", is_featured: false, is_bestseller: false })
        .in("id", archiveIds)
        .select("id"),
    );
    archived = rows.map((row) => row.id);
  }

  let deleted = [];
  if (deleteIds.length) {
    const [images, reviews] = await Promise.all([
      query((db) => db.from("product_images").select("product_id, url").in("product_id", deleteIds)),
      query((db) => db.from("reviews").select("product_id, photo_url").in("product_id", deleteIds).not("photo_url", "is", null)),
    ]);
    const rows = await query((db) => db.from("products").delete().in("id", deleteIds).select("id"));
    deleted = rows.map((row) => row.id);
    const gone = new Set(deleted);
    const ofDeleted = (row) => gone.has(row.product_id);
    if (deleted.length) {
      await removeProductFiles(
        deleted,
        images.filter(ofDeleted).map((row) => row.url),
        reviews.filter(ofDeleted).map((row) => row.photo_url),
      );
    }
  }
  return { deleted, archived };
}
