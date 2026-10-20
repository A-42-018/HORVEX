import { useQuery } from "@tanstack/react-query";
import { blockPhone, getCustomerByPhone, listAdminCustomers, unblockPhone } from "../../services/adminCustomers";
import { queryKeys } from "../../services/queryKeys";
import { CUSTOMER_PAGE_SIZE } from "../components/customers/customerRules";
import { useAdminMutation } from "./useAdminMutation";
import { usePagedList } from "./usePagedList";

/** Customers for the current filters, a page at a time (`more()` fetches only the next page). */
export function useAdminCustomers(filters) {
  return usePagedList({
    queryKey: queryKeys.customers.adminList(filters),
    fetchPage: (page) => listAdminCustomers({ ...filters, ...page }),
    pageSize: CUSTOMER_PAGE_SIZE,
    idOf: (row) => row.phone,
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
