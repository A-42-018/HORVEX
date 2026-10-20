// Pure helpers for the admin orders list: URL params ↔ filters, and the
// search / date bounds sent to the database. Days follow Bangladesh time (UTC+6).

export const ORDER_STATUSES = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned"];
export const PAGE_SIZE = 25;
export const MAX_SEARCH = 40;

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;
const DHAKA_OFFSET = "+06:00";

const isDay = (value) => typeof value === "string" && DAY_RE.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

/** URL search params → a clean filter object (unknown values dropped). */
export function readFilters(params) {
  const status = params.get("status");
  const from = params.get("from");
  const to = params.get("to");
  return {
    q: (params.get("q") ?? "").slice(0, MAX_SEARCH),
    status: ORDER_STATUSES.includes(status) ? status : "",
    from: isDay(from) ? from : "",
    to: isDay(to) ? to : "",
  };
}

/** Start of a Dhaka day as an ISO instant. */
export const dayStartIso = (day) => new Date(`${day}T00:00:00${DHAKA_OFFSET}`).toISOString();

/** Start of the day *after* `day` (exclusive upper bound for "to"). */
export const dayAfterIso = (day) => new Date(new Date(`${day}T00:00:00${DHAKA_OFFSET}`).getTime() + DAY_MS).toISOString();

/** True when both days are set and the range runs backwards. */
export const isBackwards = ({ from, to }) => Boolean(from && to && from > to);

/** Search text with the characters that break PostgREST `or(...)` removed. */
export function cleanSearchTerm(input) {
  return String(input ?? "")
    .replace(/[,()%*\\"_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SEARCH);
}

/** Digits-only part of a phone search (leading 0 / +880 dropped), or "" when it isn't phone-like. */
export function phoneFragment(term) {
  const digits = term.replace(/[\s-]/g, "");
  if (!/^\+?\d{3,}$/.test(digits)) return "";
  return digits.replace(/^\+?(880)?0?/, "");
}

/**
 * Turns the search box into PostgREST `or` clauses, or null when empty.
 * Digits match the phone (a leading 0 is dropped, since phones are stored as
 * +8801…); everything also matches the order number and customer name.
 * Characters that would break the `or(...)` syntax are removed.
 */
export function searchClauses(input) {
  const term = cleanSearchTerm(input);
  if (!term) return null;
  const clauses = [`order_number.ilike.*${term}*`, `customer_name.ilike.*${term}*`];
  const local = phoneFragment(term);
  if (local) clauses.push(`phone.ilike.*${local}*`);
  return clauses.join(",");
}

/** Count of filters beyond the status tab (for the Clear button). */
export const hasExtraFilters = ({ q, from, to }) => Boolean(q || from || to);
