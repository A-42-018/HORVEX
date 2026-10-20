// Pure helpers for the delivery-zone editor: form <-> DB row, validation, safety rules.
import { isOutsideDhaka } from "../../../lib/districts";
import { strings } from "../../strings";

const e = strings.admin.delivery.errors;

export const fieldId = (key) => `zone-${key}`;
export const LIMITS = { name: 40, eta: 60, charge: 10_000 };

export const emptyForm = () => ({ name: "", charge: "", eta: "", isActive: true });

const text = (value) => (value == null ? "" : String(value));

export function toForm(row) {
  return { name: text(row.name), charge: text(row.charge), eta: text(row.eta_text), isActive: row.is_active !== false };
}

export const activeCount = (rows) => rows.filter((row) => row.is_active).length;

/** Checkout needs at least one active zone, so the last one can't be switched off or deleted. */
export const isLastActive = (rows, row) => row.is_active && activeCount(rows) <= 1;

/** Zones with orders stay (their orders point at them); switch those off instead. */
export const canDelete = (rows, row) => row.orderCount === 0 && !isLastActive(rows, row);

/** The checkout asks for a district when the zone name contains "outside" (lib/districts). */
export const asksDistrict = (name) => isOutsideDhaka({ name });

/** Returns `{ field: message }`; empty = valid. */
export function validateForm(form, { rows = [], self = null } = {}) {
  const errors = {};
  const name = form.name.trim();
  if (!name) errors.name = e.name;
  else if (name.length > LIMITS.name) errors.name = e.nameLong(LIMITS.name);
  else if (rows.some((row) => row.id !== self?.id && row.name.trim().toLowerCase() === name.toLowerCase())) errors.name = e.nameTaken;

  const charge = form.charge.trim();
  if (!charge) errors.charge = e.charge;
  else if (!/^\d+$/.test(charge) || Number(charge) > LIMITS.charge) errors.charge = e.chargeRange(LIMITS.charge);

  if (form.eta.trim().length > LIMITS.eta) errors.eta = e.etaLong(LIMITS.eta);
  if (!form.isActive && self && isLastActive(rows, self)) errors.isActive = e.lastActive;
  return errors;
}

const orNull = (value) => (value.trim() === "" ? null : value.trim());

export function toPayload(form) {
  return { name: form.name.trim(), charge: Number(form.charge), eta_text: orNull(form.eta), is_active: form.isActive };
}

/** Only the columns that differ from the loaded row. */
export function changedColumns(payload, original) {
  return Object.fromEntries(Object.entries(payload).filter(([key, value]) => (original?.[key] ?? null) !== value));
}
