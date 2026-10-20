import { query, queryWithCount } from "./adminClient";
import { ORDER_STATUSES, dayAfterIso, dayStartIso, searchClauses } from "../admin/components/orders/orderFilters";

// Admin orders list (roadmap §10). Unlike products, orders grow without limit,
// so search, status and date run in the database and rows load a page at a time.
// RLS "read: admin" decides who may read. Staff can read orders.
const LIST_FIELDS = `
  id, order_number, customer_name, phone, district, total, status, courier, tracking_id, created_at,
  items:order_items (count)`;

function applyFilters(builder, { q, from, to }) {
  const search = searchClauses(q);
  let next = builder;
  if (search) next = next.or(search);
  if (from) next = next.gte("created_at", dayStartIso(from));
  if (to) next = next.lt("created_at", dayAfterIso(to));
  return next;
}

/** One page of orders matching the filters (`limit` rows from `offset`), newest first, plus the total match count. */
export async function listAdminOrders({ status = "", offset = 0, limit, ...filters }) {
  const { data, count } = await queryWithCount((db) => {
    let builder = db.from("orders").select(LIST_FIELDS, { count: "exact" });
    if (status) builder = builder.eq("status", status);
    return applyFilters(builder, filters)
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(offset, offset + limit - 1);
  });
  return {
    items: data.map(({ items, ...order }) => ({ ...order, itemCount: items?.[0]?.count ?? 0 })),
    total: count ?? data.length,
  };
}

/** Per-status match counts for the tabs (search + date applied, status ignored), plus "all". */
export async function countAdminOrdersByStatus(filters) {
  const counts = await Promise.all(
    ORDER_STATUSES.map(async (status) => {
      const { count } = await queryWithCount((db) =>
        applyFilters(db.from("orders").select("id", { count: "exact", head: true }).eq("status", status), filters),
      );
      return [status, count ?? 0];
    }),
  );
  const byStatus = Object.fromEntries(counts);
  return { ...byStatus, all: counts.reduce((sum, [, n]) => sum + n, 0) };
}

const DETAIL_FIELDS = `
  id, order_number, customer_name, phone, email, address, district, delivery_charge, subtotal, discount,
  coupon_code, total, payment_method, status, courier, tracking_id, customer_note, admin_note, created_at, updated_at,
  items:order_items (id, product_id, variant_id, name_snapshot, variant_snapshot, image_snapshot, unit_price, qty)`;

/** One order with its items, or null when it doesn't exist (or isn't visible). */
export async function getAdminOrder(id) {
  const row = await query((db) => db.from("orders").select(DETAIL_FIELDS).eq("id", id).maybeSingle());
  return row ? { ...row, items: [...(row.items ?? [])].sort((a, b) => a.id.localeCompare(b.id)) } : null;
}

/** Status history, oldest first. The orders trigger writes it on every status change. */
export const listOrderHistory = (orderId) =>
  query((db) =>
    db
      .from("order_status_history")
      .select("id, from_status, to_status, changed_by, note, created_at")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true }),
  );

/**
 * Changes the status only if it is still `from` (so two people can't overwrite
 * each other). No matching row → PGRST116, which the hook maps to "stale".
 */
export const updateOrderStatus = ({ id, from, to }) =>
  query((db) => db.from("orders").update({ status: to }).eq("id", id).eq("status", from).select("id, status").single());

/** Courier, tracking ID and admin note. `patch` holds only the changed columns. */
export const updateOrderDetails = ({ id, patch }) =>
  query((db) => db.from("orders").update(patch).eq("id", id).select("id, courier, tracking_id, admin_note").single());

const EXPORT_FIELDS = `
  order_number, customer_name, phone, email, address, district, delivery_charge, subtotal, discount, coupon_code,
  total, payment_method, status, courier, tracking_id, customer_note, created_at,
  items:order_items (name_snapshot, variant_snapshot, qty)`;

/**
 * Every order matching the filters (status, search, dates) for the CSV export,
 * newest first, fetched 1000 at a time and capped at `cap`. The private admin
 * note is not exported.
 */
export async function listOrdersForExport({ status = "", cap, ...filters }) {
  const rows = [];
  for (let from = 0; from < cap; from += 1000) {
    const batch = await query((db) => {
      let builder = db.from("orders").select(EXPORT_FIELDS);
      if (status) builder = builder.eq("status", status);
      return applyFilters(builder, filters)
        .order("created_at", { ascending: false })
        .order("id", { ascending: true })
        .range(from, from + 999);
    });
    rows.push(...batch);
    if (batch.length < 1000) break;
  }
  return rows;
}
