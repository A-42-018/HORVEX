import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { blockPhone, getCustomerByPhone, listAdminCustomers, unblockPhone } from "../../services/adminCustomers";
import { queryKeys } from "../../services/queryKeys";
import { useAdminMutation } from "./useAdminMutation";

/** Customers for the current filters, `limit` rows. Keeps the old rows while a new view loads. */
export function useAdminCustomers(filters, limit) {
  const key = { ...filters, limit };
  return useQuery({
    queryKey: queryKeys.customers.adminList(key),
    queryFn: () => listAdminCustomers(key),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

/** One customer's history by stored phone. `data === null` means no orders from this phone. */
export function useCustomerByPhone(phone) {
  return useQuery({
    queryKey: queryKeys.customers.adminOne(phone),
    queryFn: () => getCustomerByPhone(phone),
    enabled: Boolean(phone),
    staleTime: 15_000,
  });
}

// Customers and the block list change together; the order list doesn't show blocks.
const invalidate = [queryKeys.customers.all];

export function useBlockPhone() {
  return useAdminMutation({
    mutationFn: blockPhone,
    invalidate,
    activity: (result, { phone, reason }) => ({ action: "block", entity: "blocked_phones", entityId: phone, diff: { reason } }),
  });
}

export function useUnblockPhone() {
  return useAdminMutation({
    mutationFn: unblockPhone,
    invalidate,
    activity: (result, phone) => ({ action: "unblock", entity: "blocked_phones", entityId: phone }),
  });
}
