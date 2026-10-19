import { query } from "./adminClient";

// Generic admin writes. RLS decides who may write what; a row the caller can't
// see comes back as PGRST116 ("no rows") instead of failing silently.

/** Inserts a row and returns it. */
export const insertRow = (table, values) => query((db) => db.from(table).insert(values).select().single());

/** Updates one row by id and returns it. */
export const updateRow = (table, id, patch, { idColumn = "id" } = {}) =>
  query((db) => db.from(table).update(patch).eq(idColumn, id).select().single());

/** Deletes one row by id. */
export const deleteRow = (table, id, { idColumn = "id" } = {}) =>
  query((db) => db.from(table).delete().eq(idColumn, id));

/** Writes sort_order = position for each id, in the given order. */
export const reorderRows = (table, ids, { idColumn = "id" } = {}) =>
  Promise.all(ids.map((id, index) => query((db) => db.from(table).update({ sort_order: index }).eq(idColumn, id))));

/**
 * Appends an activity_log entry as the signed-in admin (actor defaults to
 * auth.uid()). No read-back: staff may write the log but not read it.
 */
export const logActivity = ({ action, entity, entityId = null, diff = null }) =>
  query((db) =>
    db.from("activity_log").insert({ action, entity, entity_id: entityId == null ? null : String(entityId), diff }),
  );
