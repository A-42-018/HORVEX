import { adminSupabase } from "./adminClient";

// Admin-only: imports the admin client, so keep it out of storefront code.

/**
 * Listens for new rows in `orders` over Supabase Realtime (RLS lets only signed-in
 * staff receive them; needs migration 20261020110000_b21c_orders_realtime.sql).
 * `onOrder` gets just the fields an alert needs, never the address or phone.
 * `onStatus` gets "live" or "offline"; the client re-joins by itself after a drop.
 * Returns an unsubscribe function.
 */
export function subscribeToNewOrders({ onOrder, onStatus }) {
  if (!adminSupabase) {
    onStatus?.("offline");
    return () => {};
  }

  const channel = adminSupabase
    .channel("admin-new-orders")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, ({ new: row }) => {
      if (!row?.id) return;
      onOrder({
        id: row.id,
        orderNumber: row.order_number,
        customerName: row.customer_name,
        total: row.total,
        district: row.district,
        createdAt: row.created_at,
      });
    })
    .subscribe((status) => onStatus?.(status === "SUBSCRIBED" ? "live" : "offline"));

  return () => {
    adminSupabase.removeChannel(channel);
  };
}
