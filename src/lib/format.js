// Shared formatters (roadmap §11). Every price, phone number and date in the UI
// goes through here so the format stays consistent.

// en-IN gives lakh grouping: 125000 → "1,25,000". Whole taka only.
const takaNumber = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** 1299 → "৳1,299" · 125000 → "৳1,25,000" · -200 → "−৳200" */
export function formatTaka(amount) {
  const value = Math.round(Number(amount) || 0);
  const formatted = `৳${takaNumber.format(Math.abs(value))}`;
  return value < 0 ? `−${formatted}` : formatted;
}

// Discounts below this aren't advertised (badges, "−x%" labels).
export const MIN_DISCOUNT_PERCENT = 10;

/** Whole-number % off, or 0 when there is no discount worth showing. */
export function discountPercent(price, compareAt) {
  if (!compareAt || !price || compareAt <= price) return 0;
  const percent = Math.round(((compareAt - price) / compareAt) * 100);
  return percent >= MIN_DISCOUNT_PERCENT ? percent : 0;
}

// BD mobile numbers: 01 + operator digit 3–9 + 8 digits.
const BD_MOBILE = /^01[3-9]\d{8}$/;

/**
 * Accepts what people type ("01712-345678", "8801712345678", "+880 1712 345678")
 * and returns the stored form "+8801712345678", or null if it isn't a valid BD mobile.
 */
export function normalizePhone(input) {
  let digits = String(input ?? "").replace(/\D/g, "");
  if (digits.startsWith("880")) digits = digits.slice(2);
  return BD_MOBILE.test(digits) ? `+88${digits}` : null;
}

export const isValidPhone = (input) => normalizePhone(input) !== null;

/** "+8801712345678" → "01712-345678". Returns the input unchanged if it isn't a BD mobile. */
export function formatPhone(input) {
  const normalized = normalizePhone(input);
  if (!normalized) return String(input ?? "");
  const local = normalized.slice(3);
  return `${local.slice(0, 5)}-${local.slice(5)}`;
}

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const weekdayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "long" });

/** → "19 Oct 2026" */
export const formatDate = (date) => dateFormat.format(new Date(date));

/** Delivery ETA in plain words: "by Thursday" within the week, otherwise "by 27 Oct 2026". */
export function formatDeliveryBy(date, now = new Date()) {
  const target = new Date(date);
  const days = (target - now) / 86_400_000;
  return `by ${days >= 0 && days < 7 ? weekdayFormat.format(target) : dateFormat.format(target)}`;
}
