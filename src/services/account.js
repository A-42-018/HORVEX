import { query, rpc } from "./customerAuth";

// The signed-in customer's own data (migration 20261024100000_c6b_customer_accounts.sql).
// RLS limits customer_profiles to the caller's row; my_orders() matches orders
// on the account's confirmed email.

/** { user_id, name, phone } or null before the first save. */
export const getMyProfile = (userId) =>
  query((db) => db.from("customer_profiles").select("user_id, name, phone").eq("user_id", userId).maybeSingle());

export const saveMyProfile = ({ userId, name, phone }) =>
  query((db) =>
    db
      .from("customer_profiles")
      .upsert({ user_id: userId, name: name || null, phone: phone || null }, { onConflict: "user_id" })
      .select("user_id, name, phone")
      .single(),
  );

/** Newest first: [{ order_number, status, total, item_count, created_at }]. */
export const listMyOrders = (limit = 20) => rpc("my_orders", { p_limit: limit });
