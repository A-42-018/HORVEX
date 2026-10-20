import { query, queryWithCount } from "./adminClient";
import { removeContentImageFiles } from "./adminHomeContent";

// Admin review moderation (roadmap §10, Reviews). The store shows approved rows
// only (RLS); admins see pending and rejected too. Photos live in site-media.
export const REVIEW_FOLDER = "reviews";
export const REVIEW_STATUSES = ["pending", "approved", "rejected"];
const FIELDS = "id, product_id, name, rating, text, photo_url, status, created_at, product:products(name, slug)";

/** First `limit` reviews (newest first) for a status tab ("all" = every status) plus the total. */
export async function listAdminReviews({ status, limit }) {
  const { data, count } = await queryWithCount((db) => {
    let builder = db.from("reviews").select(FIELDS, { count: "exact" });
    if (status !== "all") builder = builder.eq("status", status);
    return builder.order("created_at", { ascending: false }).range(0, limit - 1);
  });
  return { items: data, total: count ?? data.length };
}

/** { pending, approved, rejected, all } for the tab badges. */
export async function getReviewCounts() {
  const entries = await Promise.all(
    REVIEW_STATUSES.map(async (status) => {
      const { count } = await queryWithCount((db) => db.from("reviews").select("id", { count: "exact" }).eq("status", status).limit(1));
      return [status, count ?? 0];
    }),
  );
  const counts = Object.fromEntries(entries);
  counts.all = entries.reduce((sum, [, n]) => sum + n, 0);
  return counts;
}

/** Products to attach a manual review to. */
export const listReviewProducts = () => query((db) => db.from("products").select("id, name").order("name").limit(500));

/** Best-effort delete of an uploaded photo (external URLs have no file in our bucket). */
export const removeReviewPhoto = (url) => (url ? removeContentImageFiles([url]) : Promise.resolve());
