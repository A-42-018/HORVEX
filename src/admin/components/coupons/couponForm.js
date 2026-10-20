// Pure helpers for the coupon editor: form <-> DB row, validation, state label.
import { formatTaka } from "../../../lib/format";
import { strings } from "../../../lib/strings";
import { isoToLocal, localToIso } from "../collections/collectionForm";

const e = strings.admin.coupons.errors;

export const fieldId = (key) => `cp-${key}`;
export const TYPES = ["percent", "fixed", "free_shipping"];
export const CODE_PATTERN = /^[A-Z0-9_-]{3,32}$/;
export const LIMITS = { fixed: 1_000_000, minOrder: 10_000_000, maxUses: 1_000_000 };

/** Codes are stored upper-case without spaces (DB check). */
export const normalizeCode = (value) => value.toUpperCase().replace(/\s+/g, "");

export const emptyForm = () => ({
  code: "",
  type: "percent",
  value: "",
  minOrder: "",
  maxUses: "",
  startsAt: "",
  endsAt: "",
  isActive: true,
});

const text = (value) => (value == null ? "" : String(value));
const isWhole = (value) => /^\d+$/.test(value.trim());

export function toForm(row) {
  return {
    code: text(row.code),
    type: row.type,
    value: row.type === "free_shipping" ? "" : text(row.value),
    minOrder: row.min_order ? text(row.min_order) : "",
    maxUses: text(row.max_uses),
    startsAt: isoToLocal(row.starts_at),
    endsAt: isoToLocal(row.ends_at),
    isActive: row.is_active !== false,
  };
}

/** Returns `{ field: message }`; empty = valid. `self` = the row being edited (null = new). */
export function validateForm(form, { rows = [], self = null, now = new Date() } = {}) {
  const errors = {};
  const code = form.code.trim();
  if (!code) errors.code = e.code;
  else if (!CODE_PATTERN.test(code)) errors.code = e.codeFormat;
  else if (rows.some((row) => row.code === code && row.id !== self?.id)) errors.code = e.codeTaken;

  if (form.type === "percent") {
    if (!isWhole(form.value) || Number(form.value) < 1 || Number(form.value) > 100) errors.value = e.percent;
  } else if (form.type === "fixed") {
    if (!isWhole(form.value) || Number(form.value) < 1 || Number(form.value) > LIMITS.fixed) errors.value = e.fixed(formatTaka(LIMITS.fixed));
  }

  if (form.minOrder.trim() && (!isWhole(form.minOrder) || Number(form.minOrder) > LIMITS.minOrder)) errors.minOrder = e.minOrder;

  if (form.maxUses.trim()) {
    const uses = Number(form.maxUses);
    if (!isWhole(form.maxUses) || uses < 1 || uses > LIMITS.maxUses) errors.maxUses = e.maxUses;
    else if (self && uses < self.used) errors.maxUses = e.maxUsesBelowUsed(self.used);
  }

  const starts = localToIso(form.startsAt);
  const ends = localToIso(form.endsAt);
  if (form.startsAt && !starts) errors.startsAt = e.date;
  if (form.endsAt && !ends) errors.endsAt = e.date;
  if (starts && ends && new Date(ends) <= new Date(starts)) errors.endsAt = e.endBeforeStart;
  // A new or changed end date has to be in the future; an old one is left alone.
  else if (ends && new Date(ends) <= now && (!self?.ends_at || new Date(self.ends_at).getTime() !== new Date(ends).getTime())) {
    errors.endsAt = e.endPast;
  }
  return errors;
}

export function toPayload(form) {
  return {
    code: form.code.trim(),
    type: form.type,
    value: form.type === "free_shipping" ? 0 : Number(form.value),
    min_order: form.minOrder.trim() ? Number(form.minOrder) : 0,
    max_uses: form.maxUses.trim() ? Number(form.maxUses) : null,
    starts_at: localToIso(form.startsAt),
    ends_at: localToIso(form.endsAt),
    is_active: form.isActive,
  };
}

const sameValue = (key, a, b) => {
  if (key === "starts_at" || key === "ends_at") {
    const x = a ? new Date(a).getTime() : null;
    const y = b ? new Date(b).getTime() : null;
    return x === y;
  }
  return (a ?? null) === (b ?? null);
};

/** Only the columns that differ from the loaded row (keeps the activity-log diff small). */
export function changedColumns(payload, original) {
  return Object.fromEntries(Object.entries(payload).filter(([key, value]) => !sameValue(key, original?.[key], value)));
}

/** "off" | "usedUp" | "expired" | "scheduled" | "live": what a customer would meet right now. */
export function couponState(row, now = new Date()) {
  if (!row.is_active) return "off";
  if (row.max_uses != null && row.used >= row.max_uses) return "usedUp";
  if (row.ends_at && new Date(row.ends_at) <= now) return "expired";
  if (row.starts_at && new Date(row.starts_at) > now) return "scheduled";
  return "live";
}

/** "10% off" · "৳200 off" · "Free delivery" */
export function valueText(row) {
  const t = strings.admin.coupons.values;
  if (row.type === "percent") return t.percent(row.value);
  if (row.type === "fixed") return t.fixed(formatTaka(row.value));
  return t.freeShipping;
}
