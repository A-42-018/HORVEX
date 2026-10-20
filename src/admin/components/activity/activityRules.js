// Pure helpers for the activity log viewer (roadmap §10, B29c).
export const ACTIVITY_PAGE_SIZE = 50;
export const MAX_ACTIVITY = 500;

/** "orders / 1234abcd…" style target: entity plus a short id when there is one. */
export function targetOf(entry) {
  const id = entry.entity_id ? String(entry.entity_id) : "";
  return id ? `${entry.entity} · ${id.length > 12 ? `${id.slice(0, 8)}…` : id}` : entry.entity;
}

/** A diff as short text: the changed keys, or null for an empty diff. */
export function diffKeys(diff) {
  if (!diff || typeof diff !== "object") return null;
  const keys = Array.isArray(diff) ? [] : Object.keys(diff);
  return keys.length ? keys.join(", ") : null;
}

/** Pretty JSON of a diff for the details view (truncated so a huge payload can't flood the page). */
export function diffText(diff, max = 1500) {
  if (diff == null) return "";
  const text = JSON.stringify(diff, null, 2);
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/** Whether another page may exist: the server returned a full page and we're under the cap. */
export const mayHaveMore = (shown, limit) => shown >= limit && limit < MAX_ACTIVITY;
