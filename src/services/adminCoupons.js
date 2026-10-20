import { query } from "./adminClient";

// Admin coupons (roadmap §10). RLS: manager+ read and write. `used` is bumped
// by place_order, never by the admin client.
const FIELDS = "id, code, type, value, min_order, max_uses, used, starts_at, ends_at, is_active, created_at";

export const listCouponRows = () =>
  query((db) => db.from("coupons").select(FIELDS).order("created_at", { ascending: false }));
