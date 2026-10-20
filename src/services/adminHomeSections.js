import { query } from "./adminClient";

// Admin read of every home section, hidden ones included (RLS lets admins see
// them). Writes go through the generic updateRow / reorderRows in ./admin.

export function listHomeSectionRows() {
  return query((db) =>
    db
      .from("home_sections")
      .select("id, key, title, subtitle, sort_order, is_visible, updated_at")
      .order("sort_order")
      .order("key"),
  );
}
