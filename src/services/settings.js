import { query } from "./supabase";

// Store-wide settings (single row) and delivery zones.

const SETTINGS_FIELDS = `
  brand_name, logo_url, logo_light_url, favicon_url, og_image_url,
  contact_phone, whatsapp_number, contact_email, address, socials, announcements,
  footer_text, free_delivery_threshold, seo_title, seo_desc, ga4_id, fb_pixel_id,
  maintenance_mode`;
// Added in B3c (migration 20261020100000). Until it is applied, fall back to the
// original columns so the rest of the storefront keeps working.
const COURIER_FIELD = "courier_partners";

export async function getSiteSettings() {
  try {
    return await query((db) => db.from("site_settings").select(`${SETTINGS_FIELDS}, ${COURIER_FIELD}`).maybeSingle());
  } catch (error) {
    if (!String(error?.message).includes(COURIER_FIELD)) throw error;
    return query((db) => db.from("site_settings").select(SETTINGS_FIELDS).maybeSingle());
  }
}

export function listDeliveryZones() {
  return query((db) => db.from("delivery_zones").select("id, name, charge, eta_text, sort_order").order("sort_order"));
}
