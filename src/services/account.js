import { currentUser, query, rpc } from "./customerAuth";

// The signed-in customer's own data (migration 20261024100000_c6b_customer_accounts.sql).
// RLS limits customer_profiles to the caller's row; my_orders() returns the
// orders placed while signed in (orders.user_id = the caller).

const PROFILE_FIELDS = "user_id, name, phone";

/** { user_id, name, phone } or null before the first save. */
export const getMyProfile = (userId) =>
  query((db) => db.from("customer_profiles").select(PROFILE_FIELDS).eq("user_id", userId).maybeSingle());

// Update, else insert. Not an upsert: ON CONFLICT DO UPDATE also sets user_id,
// and customers may only update name and phone (column grants).
export async function saveMyProfile({ userId, name, phone }) {
  const fields = { name: name || null, phone: phone || null };
  const updated = await query((db) =>
    db.from("customer_profiles").update(fields).eq("user_id", userId).select(PROFILE_FIELDS),
  );
  if (updated.length) return updated[0];
  return query((db) =>
    db.from("customer_profiles").insert({ user_id: userId, ...fields }).select(PROFILE_FIELDS).single(),
  );
}

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
