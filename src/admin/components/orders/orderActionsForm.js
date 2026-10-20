// Pure helpers for the order actions card (roadmap §10, B25c): contact links,
// courier / tracking / admin-note form <-> DB columns, validation, diffs.
import { normalizePhone } from "../../../lib/format";
import { strings } from "../../strings";

const e = strings.admin.orders.detail.actions.errors;

export const ACTION_LIMITS = { courier: 60, tracking: 60, note: 1000 };

// Suggestions only (a datalist); any name can be typed.
export const COURIER_SUGGESTIONS = ["Pathao", "Steadfast", "RedX", "Paperfly", "eCourier", "Sundarban"];

/** `tel:` link for a stored phone, or null when it isn't a valid BD mobile. */
export const telHref = (phone) => normalizePhone(phone);

/** `https://wa.me/…` link with a short opening message, or null for an invalid phone. */
export function whatsappHref(phone, text) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized.slice(1)}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export const toActionsForm = (order) => ({
  courier: order.courier ?? "",
  tracking: order.tracking_id ?? "",
  note: order.admin_note ?? "",
});

/** Field errors keyed by field name; empty object = valid. */
export function validateActions(form) {
  const found = {};
  if (form.courier.trim().length > ACTION_LIMITS.courier) found.courier = e.courierLong(ACTION_LIMITS.courier);
  if (form.tracking.trim().length > ACTION_LIMITS.tracking) found.tracking = e.trackingLong(ACTION_LIMITS.tracking);
  if (form.note.trim().length > ACTION_LIMITS.note) found.note = e.noteLong(ACTION_LIMITS.note);
  return found;
}

/** DB columns for a valid form. Empty fields become null. */
export function toActionsPayload(form) {
  const orNull = (text) => (text.trim() === "" ? null : text.trim());
  return { courier: orNull(form.courier), tracking_id: orNull(form.tracking), admin_note: orNull(form.note) };
}

/** Only the columns whose value differs from the saved order (empty and null count as equal). */
export function changedActionColumns(order, form) {
  const next = toActionsPayload(form);
  const saved = { courier: order.courier ?? null, tracking_id: order.tracking_id ?? null, admin_note: order.admin_note ?? null };
  return Object.fromEntries(Object.entries(next).filter(([key, value]) => value !== (saved[key]?.trim?.() || null)));
}
