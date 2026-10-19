import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../services/queryKeys";
import { placeOrder, quoteOrder, toOrderItems, trackOrder } from "../services/orders";

/**
 * Live server totals for checkout. Re-quotes whenever the lines, zone or
 * coupon change; shows the previous quote meanwhile so the summary doesn't flash.
 */
export function useOrderQuote({ lines, zoneId, couponCode }) {
  return useQuery({
    queryKey: queryKeys.orders.quote(toOrderItems(lines), zoneId, couponCode),
    queryFn: () => quoteOrder({ lines, zoneId, couponCode }),
    enabled: lines.length > 0 && Boolean(zoneId),
    staleTime: 0,
    retry: false,
    placeholderData: keepPreviousData,
  });
}

/** Places the order. On success, stock changed, so cached product data is refreshed. */
export function usePlaceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: placeOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
  });
}

/** Track lookup; runs only once both fields are filled in (the page submits them). */
export function useTrackOrder({ phone, orderNumber }) {
  return useQuery({
    queryKey: queryKeys.orders.track(phone, orderNumber),
    queryFn: () => trackOrder({ phone, orderNumber }),
    enabled: Boolean(phone && orderNumber),
    retry: false,
  });
}
