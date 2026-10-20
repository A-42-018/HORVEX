// Pure helpers for the variants editor: DB row <-> form, validation, diffs.
import { strings } from "../../strings";

const e = strings.admin.productEditor.variants.errors;

export const MAX_VARIANTS = 20; // matches the order engine's 20-line cart cap
export const VARIANT_LIMITS = { name: 60, sku: 40 };
const MAX_INT = 100_000_000;
const HEX = /^#[0-9a-f]{6}$/i;

export const emptyVariant = () => ({ name: "", sku: "", priceOverride: "", stock: "0", swatchHex: "", imageId: "" });

export const toVariantForm = (row) => ({
  name: row.name ?? "",
  sku: row.sku ?? "",
  priceOverride: row.price_override == null ? "" : String(row.price_override),
  stock: String(row.stock ?? 0),
  swatchHex: row.swatch_hex ?? "",
  imageId: row.image_id ?? "",
});

const isWhole = (text) => /^\d+$/.test(text.trim()) && Number(text) <= MAX_INT;

/** Field errors keyed by field name; empty object = valid. */
export function validateVariant(form) {
  const found = {};
  const name = form.name.trim();
  if (!name) found.name = e.nameRequired;
  else if (name.length > VARIANT_LIMITS.name) found.name = e.nameLong(VARIANT_LIMITS.name);
  if (form.sku.trim().length > VARIANT_LIMITS.sku) found.sku = e.skuLong(VARIANT_LIMITS.sku);
  if (form.priceOverride.trim() !== "" && !isWhole(form.priceOverride)) found.priceOverride = e.price;
  if (!isWhole(form.stock.trim() === "" ? "x" : form.stock)) found.stock = e.stock;
  if (form.swatchHex.trim() !== "" && !HEX.test(form.swatchHex.trim())) found.swatchHex = e.swatch;
  return found;
}

/** DB columns for a valid form. Empty optional fields become null. */
export function toVariantPayload(form) {
  return {
    name: form.name.trim(),
    sku: form.sku.trim() || null,
    price_override: form.priceOverride.trim() === "" ? null : Number(form.priceOverride),
    stock: Number(form.stock),
    swatch_hex: form.swatchHex.trim() === "" ? null : form.swatchHex.trim().toLowerCase(),
    image_id: form.imageId || null,
  };
}

/** Only the columns whose value differs from the saved payload. */
export function changedVariantColumns(next, base) {
  const patch = {};
  for (const key of Object.keys(next)) if (next[key] !== base[key]) patch[key] = next[key];
  return patch;
}

export const isVariantDirty = (form, savedRow) =>
  Object.keys(changedVariantColumns(toVariantPayload(form), toVariantPayload(toVariantForm(savedRow)))).length > 0;
