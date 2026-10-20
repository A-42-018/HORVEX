import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { countAdminOrdersByStatus, getAdminOrder, listAdminOrders, listOrderHistory, updateOrderDetails, updateOrderStatus } from "../../services/adminOrders";
import { PAGE_SIZE } from "../components/orders/orderFilters";
import { useAdminMutation } from "./useAdminMutation";
import { usePagedList } from "./usePagedList";
import { queryKeys } from "../../services/queryKeys";

// Keys start with ["orders", "admin", …], so the realtime new-order alert
// (invalidates queryKeys.orders.all) refreshes these lists live.

/** Orders for the current filters, a page at a time (`more()` fetches only the next page). */
export function useAdminOrders(filters) {
  return usePagedList({
    queryKey: queryKeys.orders.adminList(filters),
    fetchPage: (page) => listAdminOrders({ ...filters, ...page }),
    pageSize: PAGE_SIZE,
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

/**
 * Status change. Invalidates all order reads (lists, counts, detail, history,
 * dashboard), customers (their counts come from order status) and products
 * (cancel/return restocks). A stale `from` (PGRST116) refetches the order so
 * the panel shows the status someone else set.
 */
export function useChangeOrderStatus() {
  const queryClient = useQueryClient();
  return useAdminMutation({
    mutationFn: updateOrderStatus,
    invalidate: [queryKeys.orders.all, queryKeys.dashboard.all, queryKeys.customers.all, queryKeys.products.all],
    activity: (result, { id, from, to }) => ({ action: "status", entity: "orders", entityId: id, diff: { from, to } }),
    onError: (error) => {
      if (error?.code === "PGRST116") queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
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
