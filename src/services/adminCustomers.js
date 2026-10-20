import { query, queryWithCount } from "./adminClient";
import { EXPORT_CAP, customerSearchClauses } from "../admin/components/customers/customerRules";

// Customers are built from orders by the admin_customers view (security_invoker,
// so the orders RLS applies). The block list is the blocked_phones table that
// place_order checks, so a blocked phone gets "order_rejected" at checkout.
const FIELDS =
  "phone, name, email, district, orders_count, total_spent, delivered_count, cancelled_count, first_order_at, last_order_at, is_blocked";

function applyFilters(builder, { q, view }) {
  const search = customerSearchClauses(q);
  let next = builder;
  if (search) next = next.or(search);
  if (view === "blocked") next = next.eq("is_blocked", true);
  return next;
}

/** First `limit` customers (most recent order first) plus the total match count. */
export async function listAdminCustomers({ limit, ...filters }) {
  const { data, count } = await queryWithCount((db) =>
    applyFilters(db.from("admin_customers").select(FIELDS, { count: "exact" }), filters)
      .order("last_order_at", { ascending: false })
      .range(0, limit - 1),
  );
  return { items: data, total: count ?? data.length };
}

/** Every matching customer for the CSV export, fetched 1000 at a time (capped at EXPORT_CAP). */
export async function listCustomersForExport(filters) {
  const rows = [];
  for (let from = 0; from < EXPORT_CAP; from += 1000) {
    const batch = await query((db) =>
      applyFilters(db.from("admin_customers").select(FIELDS), filters)
        .order("last_order_at", { ascending: false })
        .range(from, from + 999),
    );
    rows.push(...batch);
    if (batch.length < 1000) break;
  }
  return rows;
}

/** One customer by stored phone ("+8801…"), or null when there are no orders. */
export const getCustomerByPhone = (phone) =>
  query((db) => db.from("admin_customers").select(FIELDS).eq("phone", phone).maybeSingle());

/** Adds a phone to the block list. Blocking twice is harmless (it updates the reason). */
export const blockPhone = ({ phone, reason }) =>
  query((db) => db.from("blocked_phones").upsert({ phone, reason }, { onConflict: "phone" }).select("phone, reason").single());

/** Removes a phone from the block list. */
export const unblockPhone = (phone) => query((db) => db.from("blocked_phones").delete().eq("phone", phone));
