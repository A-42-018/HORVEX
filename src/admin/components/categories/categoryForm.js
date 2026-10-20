// Pure helpers for the category editor: form <-> DB row, validation, parent rules.
import { strings } from "../../strings";
import { isValidSlug } from "../../../lib/slug";

const e = strings.admin.categories.errors;

export const fieldId = (key) => `cat-${key}`;
export const LIMITS = { name: 60, description: 300 };
// `men` / `women` slugs drive the storefront gender filter (categoryScope), so they stay fixed.
export const PROTECTED_SLUGS = ["men", "women"];
export const isProtected = (row) => PROTECTED_SLUGS.includes(row?.slug);

export const emptyForm = () => ({ name: "", slug: "", description: "", parentId: "", image: "", isVisible: true });

const text = (value) => (value == null ? "" : String(value));

export function toForm(row) {
  return {
    name: text(row.name),
    slug: text(row.slug),
    description: text(row.description),
    parentId: text(row.parent_id),
    image: text(row.image),
    isVisible: row.is_visible !== false,
  };
}

/** Returns `{ field: message }`; empty = valid. */
export function validateForm(form, { rows = [], selfId = null } = {}) {
  const errors = {};
  const name = form.name.trim();
  if (!name) errors.name = e.name;
  else if (name.length > LIMITS.name) errors.name = e.nameLong(LIMITS.name);

  const slug = form.slug.trim();
  if (!slug) errors.slug = e.slug;
  else if (!isValidSlug(slug)) errors.slug = e.slugFormat;
  else if (rows.some((row) => row.slug === slug && row.id !== selfId)) errors.slug = e.slugTaken;

  if (form.description.trim().length > LIMITS.description) errors.description = e.tooLong(LIMITS.description);
  if (form.parentId && selfId && descendantIds(rows, selfId).has(form.parentId)) errors.parentId = e.parentCycle;
  return errors;
}

const orNull = (value) => (value.trim() === "" ? null : value.trim());

export function toPayload(form) {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    description: orNull(form.description),
    parent_id: form.parentId || null,
    image: orNull(form.image),
    is_visible: form.isVisible,
  };
}

/** Only the columns that differ from the loaded row (keeps the activity-log diff small). */
export function changedColumns(payload, original) {
  return Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => (original?.[key] ?? null) !== value),
  );
}

/** The category itself plus every category below it (a parent must not be one of these). */
export function descendantIds(rows, id) {
  const found = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const row of rows) {
      if (row.parent_id && found.has(row.parent_id) && !found.has(row.id)) {
        found.add(row.id);
        grew = true;
      }
    }
  }
  return found;
}

/** Parent choices for a category: everything except itself and its descendants. */
export function parentOptions(rows, selfId) {
  const blocked = selfId ? descendantIds(rows, selfId) : new Set();
  return rows
    .filter((row) => !blocked.has(row.id))
    .map((row) => ({ value: row.id, label: row.is_visible ? row.name : strings.admin.categories.hiddenName(row.name) }));
}

/** Moves one row up (-1) or down (+1); returns the new array, or the same one at the ends. */
export function moveRow(rows, id, delta) {
  const from = rows.findIndex((row) => row.id === id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= rows.length) return rows;
  const next = [...rows];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}
