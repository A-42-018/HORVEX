import { adminSupabase, query } from "./adminClient";
import { ServiceError } from "./supabase";

// Admin uploads to the public buckets (product-images, site-media,
// review-photos). Files get random names, so a replaced image never serves a
// stale cached copy and can be cached for a year.

const IMAGE_DEFAULTS = { maxDimension: 2000, maxSizeMB: 1, quality: 0.85 };

function bucketOf(bucket) {
  if (!adminSupabase) throw new ServiceError("not_configured");
  return adminSupabase.storage.from(bucket);
}

const extensionOf = (file) => file.name?.split(".").pop()?.toLowerCase() || file.type.split("/")[1] || "bin";

/** Uploads a file as-is (videos, icons). Returns { path, url, size }. */
export async function uploadFile(file, { bucket, folder, extension = extensionOf(file) }) {
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;
  await query(() => bucketOf(bucket).upload(path, file, { contentType: file.type, cacheControl: "31536000" }));
  return { path, url: publicUrl(bucket, path), size: file.size };
}

/**
 * Compresses an image to WebP in a worker (long side ≤ maxDimension, about
 * maxSizeMB), then uploads it. Returns { path, url, size, width, height }.
 */
export async function uploadImage(file, { bucket, folder, ...options }) {
  if (!file?.type?.startsWith("image/")) throw new ServiceError("not_an_image");
  const { maxDimension, maxSizeMB, quality } = { ...IMAGE_DEFAULTS, ...options };

  // Loaded on first upload only; it's a sizeable library.
  const { default: imageCompression } = await import("browser-image-compression");
  const compressed = await imageCompression(file, {
    maxWidthOrHeight: maxDimension,
    maxSizeMB,
    initialQuality: quality,
    fileType: "image/webp",
    useWebWorker: true,
  });

  const bitmap = await createImageBitmap(compressed);
  const { width, height } = bitmap;
  bitmap.close();

  const uploaded = await uploadFile(compressed, { bucket, folder, extension: "webp" });
  return { ...uploaded, width, height };
}

/** Deletes files by path. */
export const removeFiles = (bucket, paths) => query(() => bucketOf(bucket).remove(paths));

/** Public URL for a stored path. */
export const publicUrl = (bucket, path) => bucketOf(bucket).getPublicUrl(path).data.publicUrl;

/** The storage path of one of our public URLs, or null for external URLs (seed images). */
export function pathFromPublicUrl(bucket, url) {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url?.indexOf(marker) ?? -1;
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length));
}
