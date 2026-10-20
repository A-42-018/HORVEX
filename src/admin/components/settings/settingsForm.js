// Pure helpers for the Settings page: form <-> site_settings row, validation, diff.
import { normalizePhone } from "../../../lib/format";
import { strings } from "../../strings";

const e = strings.admin.settings.errors;

export const fieldId = (key) => `set-${key}`;
export const LIMITS = {
  brand: 40,
  address: 300,
  footer: 300,
  email: 254,
  url: 300,
  seoTitle: 70,
  seoDesc: 170,
  courier: 40,
  couriers: 8,
};
export const SOCIAL_KEYS = ["instagram", "facebook", "tiktok", "youtube"];
// Same shape the storefront footer accepts (lib/format + Footer isHttpUrl).
const HTTP_URL = /^https?:\/\/[^\s/$.?#][^\s]*$/i;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const GA4 = /^G-[A-Z0-9]{6,14}$/;
const PIXEL = /^\d{8,20}$/;

const text = (value) => (value == null ? "" : String(value));
const orNull = (value) => {
  const trimmed = String(value ?? "").trim();
  return trimmed || null;
};

/** One courier per line or comma, trimmed, empty and repeated names dropped. */
export function parseCouriers(input) {
  const seen = new Set();
  return String(input ?? "")
    .split(/[\n,]/)
    .map((name) => name.trim())
    .filter((name) => {
      const key = name.toLowerCase();
      if (!name || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function toForm(row) {
  const socials = row?.socials && typeof row.socials === "object" ? row.socials : {};
  return {
    brandName: text(row?.brand_name),
    logoUrl: text(row?.logo_url),
    logoLightUrl: text(row?.logo_light_url),
    faviconUrl: text(row?.favicon_url),
    ogImageUrl: text(row?.og_image_url),
    contactPhone: text(row?.contact_phone),
    whatsappNumber: text(row?.whatsapp_number),
    contactEmail: text(row?.contact_email),
    address: text(row?.address),
    footerText: text(row?.footer_text),
    couriers: (row?.courier_partners ?? []).join("\n"),
    ...Object.fromEntries(SOCIAL_KEYS.map((key) => [`social_${key}`, text(socials[key])])),
    seoTitle: text(row?.seo_title),
    seoDesc: text(row?.seo_desc),
    ga4Id: text(row?.ga4_id),
    fbPixelId: text(row?.fb_pixel_id),
    maintenance: row?.maintenance_mode === true,
  };
}

/** Returns `{ field: message }`; empty = valid. */
export function validateForm(form) {
  const errors = {};
  const brand = form.brandName.trim();
  if (!brand) errors.brandName = e.brand;
  else if (brand.length > LIMITS.brand) errors.brandName = e.tooLong(LIMITS.brand);

  const phoneFields = [["contactPhone", e.phone], ["whatsappNumber", e.whatsapp]];
  for (const [key, message] of phoneFields) {
    if (form[key].trim() && !normalizePhone(form[key])) errors[key] = message;
  }
  const email = form.contactEmail.trim();
  if (email && (email.length > LIMITS.email || !EMAIL.test(email))) errors.contactEmail = e.email;
  if (form.address.trim().length > LIMITS.address) errors.address = e.tooLong(LIMITS.address);
  if (form.footerText.trim().length > LIMITS.footer) errors.footerText = e.tooLong(LIMITS.footer);

  for (const key of ["logoUrl", "logoLightUrl", "faviconUrl", "ogImageUrl"]) {
    const url = form[key].trim();
    if (url && !HTTP_URL.test(url)) errors[key] = e.url;
  }
  for (const key of SOCIAL_KEYS) {
    const url = form[`social_${key}`].trim();
    if (url && (url.length > LIMITS.url || !HTTP_URL.test(url))) errors[`social_${key}`] = e.url;
  }

  const couriers = parseCouriers(form.couriers);
  if (couriers.length > LIMITS.couriers) errors.couriers = e.couriersMany(LIMITS.couriers);
  else if (couriers.some((name) => name.length > LIMITS.courier)) errors.couriers = e.courierLong(LIMITS.courier);

  if (form.seoTitle.trim().length > LIMITS.seoTitle) errors.seoTitle = e.tooLong(LIMITS.seoTitle);
  if (form.seoDesc.trim().length > LIMITS.seoDesc) errors.seoDesc = e.tooLong(LIMITS.seoDesc);
  const ga4 = form.ga4Id.trim().toUpperCase();
  if (ga4 && !GA4.test(ga4)) errors.ga4Id = e.ga4;
  const pixel = form.fbPixelId.trim();
  if (pixel && !PIXEL.test(pixel)) errors.fbPixelId = e.pixel;
  return errors;
}

/** Phones are stored as +8801XXXXXXXXX (what the footer and WhatsApp button read). */
const phoneOrNull = (value) => (value.trim() ? normalizePhone(value) : null);

export function toPayload(form) {
  const socials = {};
  for (const key of SOCIAL_KEYS) {
    const url = form[`social_${key}`].trim();
    if (url) socials[key] = url;
  }
  return {
    brand_name: form.brandName.trim(),
    logo_url: orNull(form.logoUrl),
    logo_light_url: orNull(form.logoLightUrl),
    favicon_url: orNull(form.faviconUrl),
    og_image_url: orNull(form.ogImageUrl),
    contact_phone: phoneOrNull(form.contactPhone),
    whatsapp_number: phoneOrNull(form.whatsappNumber),
    contact_email: orNull(form.contactEmail)?.toLowerCase() ?? null,
    address: orNull(form.address),
    footer_text: orNull(form.footerText),
    courier_partners: parseCouriers(form.couriers),
    socials,
    seo_title: orNull(form.seoTitle),
    seo_desc: orNull(form.seoDesc),
    ga4_id: orNull(form.ga4Id)?.toUpperCase() ?? null,
    fb_pixel_id: orNull(form.fbPixelId),
    maintenance_mode: form.maintenance,
  };
}

const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/**
 * Only the columns that differ from the saved row. The socials jsonb keeps keys
 * this form doesn't edit.
 */
export function changedColumns(payload, row) {
  const next = { ...payload, socials: { ...(row?.socials ?? {}), ...payload.socials } };
  for (const key of SOCIAL_KEYS) if (!payload.socials[key]) delete next.socials[key];
  const patch = {};
  for (const [column, value] of Object.entries(next)) {
    if (!same(value, row?.[column] ?? (column === "courier_partners" ? [] : null))) patch[column] = value;
  }
  return patch;
}

/** Free-delivery amount: blank = no free-delivery offer. Returns `{ value } | { error }`. */
export function parseThreshold(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return { value: null };
  if (!/^\d+$/.test(raw) || Number(raw) > 10_000_000) return { error: strings.admin.settings.errors.threshold };
  return { value: Number(raw) };
}
