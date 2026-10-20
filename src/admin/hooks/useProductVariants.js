import { useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteRow, updateRow } from "../../services/admin";
import { addProductVariant, listProductVariants, reorderProductVariants } from "../../services/adminProducts";
import { queryKeys } from "../../services/queryKeys";
import { useAdminMutation } from "./useAdminMutation";

// Variants feed the PDP picker, card swatches, cart stock limits and the admin
// list's variant count, so every write refreshes the whole products domain.
const INVALIDATE = [queryKeys.products.all];

/** One product's variants, in storefront order. */
export function useProductVariants(productId) {
  return useQuery({
    queryKey: queryKeys.products.adminVariants(productId),
    queryFn: () => listProductVariants(productId),
    enabled: Boolean(productId),
    staleTime: 0,
  });
}

/** add.mutateAsync({ values, sortOrder }) with DB-column `values`. */
export function useAddProductVariant(productId) {
  return useAdminMutation({
    mutationFn: ({ values, sortOrder }) => addProductVariant({ productId, values, sortOrder }),
    invalidate: INVALIDATE,
    activity: (row, { values }) => ({ action: "create", entity: "product_variants", entityId: row.id, diff: { product_id: productId, ...values } }),
  });
}

/** update.mutateAsync({ id, patch }) with only the changed columns. */
export function useUpdateProductVariant() {
  return useAdminMutation({
    mutationFn: ({ id, patch }) => updateRow("product_variants", id, patch),
    invalidate: INVALIDATE,
    activity: (row, { id, patch }) => ({ action: "update", entity: "product_variants", entityId: id, diff: patch }),
  });
}

export function useDeleteProductVariant() {
  return useAdminMutation({
    mutationFn: (variant) => deleteRow("product_variants", variant.id),
    invalidate: INVALIDATE,
    activity: (result, variant) => ({ action: "delete", entity: "product_variants", entityId: variant.id }),
  });
}

/** Move up/down. The list updates at once and rolls back if the save fails. reorder.mutate(orderedVariants). */
export function useReorderProductVariants(productId) {
  const queryClient = useQueryClient();
  const key = queryKeys.products.adminVariants(productId);
  return useAdminMutation({
    mutationFn: (ordered) => reorderProductVariants(ordered.map((variant) => variant.id)),
    invalidate: INVALIDATE,
    activity: (result, ordered) => ({
      action: "reorder",
      entity: "product_variants",
      entityId: productId,
      diff: { ids: ordered.map((variant) => variant.id) },
    }),
    async onMutate(ordered) {
      await queryClient.cancelQueries({ queryKey: key });
      const before = queryClient.getQueryData(key);
      queryClient.setQueryData(
        key,
        ordered.map((variant, index) => ({ ...variant, sort_order: index })),
      );
      return { before };
    },
    onError(error, ordered, context) {
      if (context?.before) queryClient.setQueryData(key, context.before);
    },
  });
}
