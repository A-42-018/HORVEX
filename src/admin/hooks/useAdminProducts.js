import { useQuery, useQueryClient } from "@tanstack/react-query";
import { updateRow } from "../../services/admin";
import {
  duplicateAdminProduct,
  getAdminProduct,
  listAdminCategories,
  listAdminProducts,
  saveProductCost,
} from "../../services/adminProducts";
import { queryKeys } from "../../services/queryKeys";
import { useAdminCrud, useAdminMutation } from "./useAdminMutation";

const PRODUCT_DOMAINS = [queryKeys.products.all, queryKeys.dashboard.all];

/** Every product, drafts included (admin session). */
export function useAdminProducts() {
  return useQuery({
    queryKey: queryKeys.products.adminList(),
    queryFn: listAdminProducts,
    staleTime: 30_000,
  });
}

/**
 * Quick toggles (status, featured, bestseller): patch one product row.
 * The list updates at once and rolls back only that product's fields if the
 * save fails, so several quick toggles in a row don't undo each other.
 * `onSaved` / `onFailed` get `{ product, patch }`.
 */
export function useUpdateProduct({ onSaved, onFailed } = {}) {
  const queryClient = useQueryClient();
  const listKey = queryKeys.products.adminList();

  const patchRow = (id, patch) =>
    queryClient.setQueryData(listKey, (old) =>
      old ? { ...old, items: old.items.map((item) => (item.id === id ? { ...item, ...patch } : item)) } : old,
    );

  return useAdminMutation({
    mutationFn: ({ product, patch }) => updateRow("products", product.id, patch),
    invalidate: [queryKeys.products.all, queryKeys.dashboard.all],
    activity: (row, { product, patch }) => ({
      action: "update",
      entity: "products",
      entityId: product.id,
      diff: patch,
    }),
    async onMutate({ product, patch }) {
      await queryClient.cancelQueries({ queryKey: listKey });
      const before = Object.fromEntries(Object.keys(patch).map((key) => [key, product[key]]));
      patchRow(product.id, patch);
      return { before };
    },
    onError(error, { product, patch }, context) {
      if (context?.before) patchRow(product.id, context.before);
      onFailed?.({ product, patch, error });
    },
    onSuccess: (row, { product, patch }) => onSaved?.({ product, patch }),
  });
}

/** One product for the editor. Not refetched on focus: the form owns unsaved edits. */
export function useAdminProduct(id) {
  return useQuery({
    queryKey: queryKeys.products.adminDetail(id),
    queryFn: () => getAdminProduct(id),
    enabled: Boolean(id),
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 0,
  });
}

/** All categories for the picker (hidden ones included). */
export function useAdminCategories() {
  return useQuery({ queryKey: queryKeys.categories.adminList(), queryFn: listAdminCategories, staleTime: 60_000 });
}

/** create / update for the `products` table (logged, invalidates the catalog + dashboard). */
export function useProductCrud() {
  return useAdminCrud("products", { invalidate: PRODUCT_DOMAINS });
}

/** Cost price lives in its own admin-only table. */
export function useSaveProductCost() {
  return useAdminMutation({
    mutationFn: ({ productId, costPrice }) => saveProductCost(productId, costPrice),
    invalidate: [queryKeys.products.all],
    activity: (result, { productId, costPrice }) => ({
      action: "update",
      entity: "product_costs",
      entityId: productId,
      diff: { cost_price: costPrice },
    }),
  });
}

/** Copies a product as a draft; `onSuccess` gets `{ copy, source }`. */
export function useDuplicateProduct(options = {}) {
  return useAdminMutation({
    ...options,
    mutationFn: (id) => duplicateAdminProduct(id),
    invalidate: PRODUCT_DOMAINS,
    activity: ({ copy, source }) => ({
      action: "duplicate",
      entity: "products",
      entityId: copy.id,
      diff: { from: source.id, slug: copy.slug },
    }),
  });
}
