import { query, rpc } from "./adminClient";

// Admin FAQ, testimonials and announcement-bar messages (roadmap §10, Content).
// Hidden rows are visible to admins via RLS. Announcements live in the single
// site_settings row (jsonb array); managers save them through `set_announcements`.
const FAQ_FIELDS = "id, question, answer, topic, sort_order, is_visible";
const TESTIMONIAL_FIELDS = "id, name, location, text, rating, photo_url, sort_order, is_visible";

export const listFaqRows = () =>
  query((db) => db.from("faqs").select(FAQ_FIELDS).order("sort_order").order("created_at"));

export const listTestimonialRows = () =>
  query((db) => db.from("testimonials").select(TESTIMONIAL_FIELDS).order("sort_order").order("created_at"));

async function nextSortOrder(table) {
  const rows = await query((db) => db.from(table).select("sort_order").order("sort_order", { ascending: false }).limit(1));
  return (rows[0]?.sort_order ?? -1) + 1;
}

export const nextFaqSortOrder = () => nextSortOrder("faqs");
export const nextTestimonialSortOrder = () => nextSortOrder("testimonials");

/** Distinct FAQ topics already in use, for the editor's suggestions. */
export const topicsOf = (rows) => [...new Set(rows.map((row) => row.topic?.trim()).filter(Boolean))];

export async function getAnnouncementRows() {
  const row = await query((db) => db.from("site_settings").select("announcements").maybeSingle());
  return Array.isArray(row?.announcements) ? row.announcements : [];
}

/** Replaces the whole announcements array (manager+, via a security-definer function). */
export const saveAnnouncementRows = (messages) => rpc("set_announcements", { p_messages: messages });

// Policy and About pages. The store routes are fixed (/about, /policy/:slug),
// so admins edit existing rows only; RLS lets managers update.
const PAGE_FIELDS = "id, slug, title, content, seo_desc, is_published, updated_at";

export const listPageRows = () => query((db) => db.from("pages").select(PAGE_FIELDS).order("slug"));
