import { query } from "./supabase";

// Store-wide settings (single row) and delivery zones.

const SETTINGS_FIELDS = `
  brand_name, logo_url, logo_light_url, favicon_url, og_image_url,
  contact_phone, whatsapp_number, contact_email, address, socials, announcements,
  footer_text, free_delivery_threshold, seo_title, seo_desc, ga4_id, fb_pixel_id,
  maintenance_mode`;

export function getSiteSettings() {
  return query((db) => db.from("site_settings").select(SETTINGS_FIELDS).maybeSingle());
}

export function listDeliveryZones() {
  return query((db) => db.from("delivery_zones").select("id, name, charge, eta_text, sort_order").order("sort_order"));
}
