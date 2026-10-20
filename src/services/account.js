import { currentUser, query, rpc } from "./customerAuth";

// The signed-in customer's own data (migration 20261024100000_c6b_customer_accounts.sql).
// RLS limits customer_profiles to the caller's row; my_orders() returns the
// orders placed while signed in (orders.user_id = the caller).

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

/** Checkout prefill for the signed-in customer: { name, phone, email }, or null when signed out. */
export async function getCheckoutPrefill() {
  const user = await currentUser();
  if (!user) return null;
  const profile = await getMyProfile(user.id).catch(() => null);
  return {
    name: profile?.name ?? user.user_metadata?.name ?? "",
    phone: profile?.phone ?? "",
    email: user.email ?? "",
  };
}
