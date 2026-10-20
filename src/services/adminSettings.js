import { query, rpc } from "./adminClient";

// Admin side of site_settings (single row). Updates are owner-only in RLS except
// two columns managers may change through narrow functions (migration
// 20261020120000): the announcement list and the free-delivery amount.
const FIELDS = `
  brand_name, logo_url, logo_light_url, favicon_url, og_image_url,
  contact_phone, whatsapp_number, contact_email, address, socials,
  footer_text, courier_partners, seo_title, seo_desc, ga4_id, fb_pixel_id,
  maintenance_mode, free_delivery_threshold, updated_at`;

export const getSettingsRow = () => query((db) => db.from("site_settings").select(FIELDS).maybeSingle());

/** Owner update of changed columns. No row back = RLS refused (not the owner). */
export const saveSettingsPatch = (patch) =>
  query((db) => db.from("site_settings").update(patch).eq("id", true).select(FIELDS).single());

export const getFreeDeliveryThreshold = async () => {
  const row = await query((db) => db.from("site_settings").select("free_delivery_threshold").maybeSingle());
  return row?.free_delivery_threshold ?? null;
};

/** Manager+. `null` removes the free-delivery offer. */
export const saveFreeDeliveryThreshold = (amount) => rpc("set_free_delivery_threshold", { p_amount: amount });
