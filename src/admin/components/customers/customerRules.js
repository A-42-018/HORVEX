// Pure rules for the admin customers list and the block list (roadmap §10, B26b).
import { cleanSearchTerm, phoneFragment } from "../orders/orderFilters";

export const CUSTOMER_VIEWS = ["all", "blocked"];
export const CUSTOMER_PAGE_SIZE = 25;
export const MAX_REASON = 200;
export const EXPORT_CAP = 20_000;

/** URL search params → a clean filter object. */
export function readCustomerFilters(params) {
  const view = params.get("view");
  return {
    q: cleanSearchTerm(params.get("q") ?? "").slice(0, 40),
    view: CUSTOMER_VIEWS.includes(view) && view !== "all" ? view : "all",
  };
}

/** PostgREST `or` clauses for the customers view (name, email, phone), or null when empty. */
export function customerSearchClauses(input) {
  const term = cleanSearchTerm(input);
  if (!term) return null;
  const clauses = [`name.ilike.*${term}*`, `email.ilike.*${term}*`];
  const local = phoneFragment(term);
  if (local) clauses.push(`phone.ilike.*${local}*`);
  return clauses.join(",");
}

/** Orders that reached an outcome: delivered, or cancelled / returned. Open orders don't count. */
export const settledCount = (c) => (c.delivered_count ?? 0) + (c.cancelled_count ?? 0);

/** Share of settled orders that were delivered, 0–100, or null when nothing has settled yet. */
export function deliveredShare(c) {
  const settled = settledCount(c);
  return settled === 0 ? null : Math.round((c.delivered_count / settled) * 100);
}

/**
 * Warning level for the badge: "high" when two or more orders failed and they
 * outnumber the deliveries, "watch" for any failed order, otherwise "none".
 * A hint for staff only; blocking is always a manual decision.
 */
export function riskLevel(c) {
  const failed = c.cancelled_count ?? 0;
  if (failed >= 2 && failed > (c.delivered_count ?? 0)) return "high";
  return failed >= 1 ? "watch" : "none";
}

/** Reason text → trimmed value or null; `tooLong` flags it when over the limit. */
export function readReason(input) {
  const text = String(input ?? "").trim();
  return { value: text || null, tooLong: text.length > MAX_REASON };
}

/** Search term to open this customer's orders in the orders list (leading 0, since the list drops it again). */
export const ordersLinkFor = (phone) => `/admin/orders?q=${encodeURIComponent(String(phone ?? "").replace(/^\+88/, ""))}`;
