// Pure helpers for review moderation: tabs, row actions, manual-review form.
import { strings } from "../../strings";
import { orNull } from "../homepage/contentRules";

const c = strings.admin.homeContent.common.errors;
const e = strings.admin.reviews.errors;

export const REVIEW_PAGE_SIZE = 20;
export const REVIEW_TABS = ["pending", "approved", "rejected", "all"];
export const REVIEW_LIMITS = { name: 80, text: 2000 };
export const reviewFieldId = (key) => `review-${key}`;

export const readReviewFilters = (params) => {
  const status = params.get("status");
  return { status: REVIEW_TABS.includes(status) ? status : "pending" };
};

/** Row buttons for a status: pending → approve / reject, approved → hide, rejected → approve. */
export const reviewActions = (status) => (status === "pending" ? ["approve", "reject"] : status === "approved" ? ["hide"] : ["approve"]);
export const ACTION_STATUS = { approve: "approved", reject: "rejected", hide: "rejected" };

export const emptyReviewForm = () => ({ productId: "", name: "", rating: "5", text: "", photoUrl: "", approved: true });

/** Returns `{ field: message }`; empty = valid. */
export function validateReview(form) {
  const errors = {};
  const name = form.name.trim();
  if (!name) errors.name = e.name;
  else if (name.length > REVIEW_LIMITS.name) errors.name = c.tooLong(REVIEW_LIMITS.name);
  if (!["1", "2", "3", "4", "5"].includes(form.rating)) errors.rating = e.rating;
  const body = form.text.trim();
  if (!body) errors.text = e.text;
  else if (body.length > REVIEW_LIMITS.text) errors.text = c.tooLong(REVIEW_LIMITS.text);
  return errors;
}

export const reviewToPayload = (form) => ({
  product_id: orNull(form.productId),
  name: form.name.trim(),
  rating: Number(form.rating),
  text: form.text.trim(),
  photo_url: orNull(form.photoUrl),
  status: form.approved ? "approved" : "pending",
});
