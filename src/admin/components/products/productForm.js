// Pure helpers for the product editor: form <-> DB row, and validation.
import { strings } from "../../../lib/strings";
import { isValidSlug, slugify } from "../../../lib/slug";

const e = strings.admin.productEditor.errors;

// Field ids are `pe-<key>` so the editor can move focus to the first error.
export const fieldId = (key) => `pe-${key}`;

export const GENDERS = ["unisex", "men", "women"];
export const STATUS_OPTIONS = ["draft", "active", "archived"];
export const BADGES = ["new", "sale", "limited"];
// Same keys the storefront Specifications tab labels (+ the free-text box list).
export const SPEC_KEYS = [
  "case_size",
  "case_material",
  "strap",
  "movement",
  "glass",
  "water_resistance",
  "weight",
  "warranty",
  "box_contents",
];

export const LIMITS = { name: 120, shortDesc: 200, description: 5000, seoTitle: 70, seoDesc: 160, spec: 120, box: 400 };
const MAX_INT = 100_000_000;

export function emptyForm() {
  return {
    name: "",
    slug: "",
    sku: "",
    categoryId: "",
    gender: "unisex",
    shortDesc: "",
    description: "",
    price: "",
    compareAtPrice: "",
    costPrice: "",
    stock: "0",
    lowStockAt: "3",
    status: "draft",
    badges: [],
    specs: Object.fromEntries(SPEC_KEYS.map((key) => [key, ""])),
    isFeatured: false,
    isBestseller: false,
    sortOrder: "0",
    seoTitle: "",
    seoDesc: "",
  };
}

const text = (value) => (value == null ? "" : String(value));

/** DB row (+ cost_price) → form strings. */
export function toForm(product, costPrice = null) {
  const specs = product.specs && typeof product.specs === "object" ? product.specs : {};
  return {
    name: text(product.name),
    slug: text(product.slug),
    sku: text(product.sku),
    categoryId: text(product.category_id),
    gender: product.gender ?? "unisex",
    shortDesc: text(product.short_desc),
    description: text(product.description),
    price: text(product.price),
    compareAtPrice: text(product.compare_at_price),
    costPrice: text(costPrice),
    stock: text(product.stock ?? 0),
    lowStockAt: text(product.low_stock_at ?? 3),
    status: product.status ?? "draft",
    badges: Array.isArray(product.badges) ? product.badges.filter((b) => BADGES.includes(b)) : [],
    specs: Object.fromEntries(SPEC_KEYS.map((key) => [key, text(specs[key])])),
    isFeatured: Boolean(product.is_featured),
    isBestseller: Boolean(product.is_bestseller),
    sortOrder: text(product.sort_order ?? 0),
    seoTitle: text(product.seo_title),
    seoDesc: text(product.seo_desc),
  };
}

const isWhole = (value) => /^\d+$/.test(value.trim());
const whole = (value) => Number.parseInt(value.trim(), 10);

/** Returns `{ field: message }`; empty object = valid. Fields: names of `form` keys, `specs.<key>` for specs. */
export function validateForm(form) {
  const errors = {};
  const name = form.name.trim();
  if (!name) errors.name = e.name;
  else if (name.length > LIMITS.name) errors.name = e.nameLong(LIMITS.name);

  const slug = form.slug.trim();
  if (!slug) errors.slug = e.slug;
  else if (!isValidSlug(slug)) errors.slug = e.slugFormat;

  if (form.sku.trim().length > 60) errors.sku = e.skuLong;

  const checkMoney = (key, { required = false } = {}) => {
    const raw = form[key].trim();
    if (!raw) return required ? (errors[key] = e.required) : null;
    if (!isWhole(raw) || whole(raw) > MAX_INT) errors[key] = e.wholeNumber;
    return null;
  };
  checkMoney("price", { required: true });
  checkMoney("compareAtPrice");
  checkMoney("costPrice");
  checkMoney("stock", { required: true });
  checkMoney("lowStockAt", { required: true });
  checkMoney("sortOrder", { required: true });

  if (!errors.price && !errors.compareAtPrice && form.compareAtPrice.trim()) {
    if (whole(form.compareAtPrice) <= whole(form.price)) errors.compareAtPrice = e.compareAt;
  }

  if (form.shortDesc.trim().length > LIMITS.shortDesc) errors.shortDesc = e.tooLong(LIMITS.shortDesc);
  if (form.description.trim().length > LIMITS.description) errors.description = e.tooLong(LIMITS.description);
  if (form.seoTitle.trim().length > LIMITS.seoTitle) errors.seoTitle = e.tooLong(LIMITS.seoTitle);
  if (form.seoDesc.trim().length > LIMITS.seoDesc) errors.seoDesc = e.tooLong(LIMITS.seoDesc);
  for (const key of SPEC_KEYS) {
    const limit = key === "box_contents" ? LIMITS.box : LIMITS.spec;
    if (form.specs[key].trim().length > limit) errors[`specs.${key}`] = e.tooLong(limit);
  }
  return errors;
}

const orNull = (value) => (value.trim() === "" ? null : value.trim());

/**
 * Form → `products` columns. `existingSpecs` keeps spec keys this form doesn't
 * edit (set elsewhere or by the seed). Cost is separate (`product_costs`).
 */
export function toPayload(form, existingSpecs = {}) {
  const specs = { ...(existingSpecs && typeof existingSpecs === "object" ? existingSpecs : {}) };
  for (const key of SPEC_KEYS) {
    const value = form.specs[key].trim();
    if (value) specs[key] = value;
    else delete specs[key];
  }
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    sku: orNull(form.sku),
    category_id: form.categoryId || null,
    gender: form.gender,
    short_desc: orNull(form.shortDesc),
    description: orNull(form.description),
    price: whole(form.price),
    compare_at_price: form.compareAtPrice.trim() ? whole(form.compareAtPrice) : null,
    stock: whole(form.stock),
    low_stock_at: whole(form.lowStockAt),
    status: form.status,
    badges: BADGES.filter((badge) => form.badges.includes(badge)),
    specs,
    is_featured: form.isFeatured,
    is_bestseller: form.isBestseller,
    sort_order: whole(form.sortOrder),
    seo_title: orNull(form.seoTitle),
    seo_desc: orNull(form.seoDesc),
  };
}

/** Cost in whole taka, or null when empty. */
export const costOf = (form) => (form.costPrice.trim() ? whole(form.costPrice) : null);

/** Only the columns whose value changed (keeps the activity log small). */
export function changedColumns(next, prev) {
  return Object.fromEntries(Object.entries(next).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(prev?.[key])));
}

/** True when any editable field differs from the saved baseline. */
export const isDirty = (form, baseline) => JSON.stringify(form) !== JSON.stringify(baseline);

export { slugify };
