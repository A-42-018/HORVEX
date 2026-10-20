import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { countAdminOrdersByStatus, getAdminOrder, listAdminOrders, listOrderHistory, updateOrderDetails, updateOrderStatus } from "../../services/adminOrders";
import { useAdminMutation } from "./useAdminMutation";
import { queryKeys } from "../../services/queryKeys";

// Keys start with ["orders", "admin", …], so the realtime new-order alert
// (invalidates queryKeys.orders.all) refreshes these lists live.

/** Orders for the current filters, `limit` rows. Keeps the old rows while a new view loads. */
export function useAdminOrders(filters, limit) {
  const key = { ...filters, limit };
  return useQuery({
    queryKey: queryKeys.orders.adminList(key),
    queryFn: () => listAdminOrders(key),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

/** Tab counts for the current search + date range. */
export function useAdminOrderCounts({ q, from, to }) {
  const filters = { q, from, to };
  return useQuery({
    queryKey: queryKeys.orders.adminCounts(filters),
    queryFn: () => countAdminOrdersByStatus(filters),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

/** One order with items. `data === null` means not found. */
export function useAdminOrder(id) {
  return useQuery({
    queryKey: queryKeys.orders.adminDetail(id),
    queryFn: () => getAdminOrder(id),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

export function useOrderHistory(id) {
  return useQuery({
    queryKey: queryKeys.orders.adminHistory(id),
    queryFn: () => listOrderHistory(id),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

/** Status change. Invalidates all order reads (lists, counts, detail, history, dashboard). */
export function useChangeOrderStatus() {
  return useAdminMutation({
    mutationFn: updateOrderStatus,
    invalidate: [queryKeys.orders.all, queryKeys.dashboard.all],
    activity: (result, { id, from, to }) => ({ action: "status", entity: "orders", entityId: id, diff: { from, to } }),
  });
}

/** Courier / tracking / admin note. Invalidates order reads (the list shows courier + tracking). */
export function useSaveOrderDetails() {
  return useAdminMutation({
    mutationFn: updateOrderDetails,
    invalidate: [queryKeys.orders.all],
    activity: (result, { id, patch }) => ({ action: "update", entity: "orders", entityId: id, diff: patch }),
  });
}
