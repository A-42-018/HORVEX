import { query } from "./adminClient";

// Admin delivery zones (roadmap §10). Inactive zones are visible to admins via
// RLS. The order count comes from an embedded aggregate over `orders.zone_id`
// (deleting a zone nulls that column on its orders, so zones with orders are
// switched off instead of deleted).
const FIELDS = "id, name, charge, eta_text, sort_order, is_active, orders(count)";

export async function listZoneRows() {
  const rows = await query((db) => db.from("delivery_zones").select(FIELDS).order("sort_order").order("created_at"));
  return rows.map(({ orders, ...row }) => ({ ...row, orderCount: orders?.[0]?.count ?? 0 }));
}

/** Largest sort_order + 1, so a new zone lands last. */
export async function nextZoneSortOrder() {
  const rows = await query((db) =>
    db.from("delivery_zones").select("sort_order").order("sort_order", { ascending: false }).limit(1),
  );
  return (rows[0]?.sort_order ?? -1) + 1;
}
