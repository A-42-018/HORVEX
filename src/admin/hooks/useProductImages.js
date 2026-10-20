import { useQuery, useQueryClient } from "@tanstack/react-query";
import { updateRow } from "../../services/admin";
import {
  IMAGE_BUCKET,
  addProductImage,
  deleteProductImage,
  listProductImages,
  reorderProductImages,
} from "../../services/adminProducts";
import { queryKeys } from "../../services/queryKeys";
import { useAdminMutation } from "./useAdminMutation";
import { useImageUpload } from "./useImageUpload";

// Images show on the storefront card, PDP and search, and feed the dashboard's
// "no image" state, so every write refreshes the whole products domain.
const INVALIDATE = [queryKeys.products.all];

/** One product's images, in storefront order. */
export function useProductImages(productId) {
  return useQuery({
    queryKey: queryKeys.products.adminImages(productId),
    queryFn: () => listProductImages(productId),
    enabled: Boolean(productId),
    staleTime: 0,
  });
}

/**
 * Compress + upload one file, then save its row at the end of the list:
 * add.mutateAsync({ file, sortOrder }). Logs one activity entry per image.
 */
export function useAddProductImage(productId) {
  const upload = useImageUpload({ bucket: IMAGE_BUCKET, folder: productId });
  return useAdminMutation({
    mutationFn: async ({ file, sortOrder, alt }) => {
      const { url } = await upload.mutateAsync(file);
      return addProductImage({ productId, url, alt, sortOrder });
    },
    invalidate: INVALIDATE,
    activity: (row) => ({ action: "create", entity: "product_images", entityId: row.id, diff: { product_id: productId } }),
  });
}

/** Alt text and the lifestyle flag: update.mutate({ id, patch }). */
export function useUpdateProductImage() {
  return useAdminMutation({
    mutationFn: ({ id, patch }) => updateRow("product_images", id, patch),
    invalidate: INVALIDATE,
    activity: (row, { id, patch }) => ({ action: "update", entity: "product_images", entityId: id, diff: patch }),
  });
}

export function useDeleteProductImage() {
  return useAdminMutation({
    mutationFn: (image) => deleteProductImage(image),
    invalidate: INVALIDATE,
    activity: (result, image) => ({ action: "delete", entity: "product_images", entityId: image.id }),
  });
}

/**
 * Drag-reorder. The grid updates at once; if the save fails the previous order
 * comes back. reorder.mutate(orderedImages).
 */
export function useReorderProductImages(productId) {
  const queryClient = useQueryClient();
  const key = queryKeys.products.adminImages(productId);
  return useAdminMutation({
    mutationFn: (ordered) => reorderProductImages(ordered.map((image) => image.id)),
    invalidate: INVALIDATE,
    activity: (result, ordered) => ({
      action: "reorder",
      entity: "product_images",
      entityId: productId,
      diff: { ids: ordered.map((image) => image.id) },
    }),
    async onMutate(ordered) {
      await queryClient.cancelQueries({ queryKey: key });
      const before = queryClient.getQueryData(key);
      queryClient.setQueryData(
        key,
        ordered.map((image, index) => ({ ...image, sort_order: index })),
      );
      return { before };
    },
    onError(error, ordered, context) {
      if (context?.before) queryClient.setQueryData(key, context.before);
    },
  });
}
