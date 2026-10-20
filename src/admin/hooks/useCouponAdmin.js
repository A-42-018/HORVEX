import { useQuery, useQueryClient } from "@tanstack/react-query";
import { updateRow } from "../../services/admin";
import { listCouponRows } from "../../services/adminCoupons";
import { queryKeys } from "../../services/queryKeys";
import { useAdminCrud, useAdminMutation } from "./useAdminMutation";

const INVALIDATE = [queryKeys.coupons.all];

/** Every coupon (off, expired and used up too), newest first. */
export function useCouponRows() {
  return useQuery({ queryKey: queryKeys.coupons.adminRows(), queryFn: listCouponRows, staleTime: 0 });
}

export const useCouponCrud = () => useAdminCrud("coupons", { invalidate: INVALIDATE });

/** Quick On/Off switch: the row updates at once and rolls back on error. */
export function useToggleCoupon({ onFailed } = {}) {
  const queryClient = useQueryClient();
  const key = queryKeys.coupons.adminRows();
  const patch = (id, values) =>
    queryClient.setQueryData(key, (old) => old?.map((row) => (row.id === id ? { ...row, ...values } : row)));

  return useAdminMutation({
    mutationFn: ({ id, patch: values }) => updateRow("coupons", id, values),
    invalidate: INVALIDATE,
    activity: (row, { id, patch: values }) => ({ action: "update", entity: "coupons", entityId: id, diff: values }),
    async onMutate({ id, patch: values }) {
      await queryClient.cancelQueries({ queryKey: key });
      const before = queryClient.getQueryData(key)?.find((row) => row.id === id);
      patch(id, values);
      return { id, previous: Object.fromEntries(Object.keys(values).map((k) => [k, before?.[k]])) };
    },
    onError(error, vars, context) {
      if (context) patch(context.id, context.previous);
      onFailed?.(error);
    },
  });
}
