// Pure helpers for the homepage builder: section copy, form <-> DB row, ordering.
import { strings } from "../../strings";

const t = strings.admin.homepage;

export const LIMITS = { title: 80, subtitle: 200 };

const humanize = (key) => key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

/** { label, about, fields: { title, subtitle } | null } for a home_sections key. */
export function metaFor(key) {
  const meta = t.sections[key];
  if (!meta) return { label: humanize(key), about: "", fields: null };
  return { label: meta.label, about: meta.about ?? "", fields: meta.fields ? t.fieldSets[meta.fields] : null };
}

const text = (value) => (value == null ? "" : String(value));

export const toForm = (row) => ({ title: text(row.title), subtitle: text(row.subtitle) });

/** Returns `{ field: message }`; empty = valid. */
export function validateForm(form) {
  const errors = {};
  for (const field of ["title", "subtitle"]) {
    if (form[field].trim().length > LIMITS[field]) errors[field] = t.edit.errors.tooLong(LIMITS[field]);
  }
  return errors;
}

const orNull = (value) => (value.trim() === "" ? null : value.trim());

export const toPayload = (form) => ({ title: orNull(form.title), subtitle: orNull(form.subtitle) });

/** Only the columns that differ from the loaded row. */
export function changedColumns(payload, original) {
  return Object.fromEntries(Object.entries(payload).filter(([key, value]) => (original[key] ?? null) !== value));
}

/** Swaps a row with its neighbour; returns the same array when it can't move. */
export function moveRow(rows, id, delta) {
  const from = rows.findIndex((row) => row.id === id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= rows.length) return rows;
  const next = [...rows];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

/** Moves one row to another row's slot (drag and drop). */
export function dragRow(rows, activeId, overId) {
  const from = rows.findIndex((row) => row.id === activeId);
  const to = rows.findIndex((row) => row.id === overId);
  if (from < 0 || to < 0 || from === to) return rows;
  const next = [...rows];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** True when hiding `row` would leave no visible section. */
export const isLastVisible = (rows, row) => row.is_visible && rows.filter((r) => r.is_visible).length === 1;
