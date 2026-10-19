import { useMutation } from "@tanstack/react-query";
import { uploadImage } from "../../services/storage";

/**
 * Compress + upload one image: upload.mutateAsync(file) → { path, url, size, width, height }.
 * Nothing is logged or invalidated here; the record that stores the URL does that on save.
 * Bucket is "product-images", "site-media" or "review-photos" (manager+ may write).
 */
export const useImageUpload = ({ bucket, folder, ...options }) =>
  useMutation({ mutationFn: (file) => uploadImage(file, { bucket, folder, ...options }) });
