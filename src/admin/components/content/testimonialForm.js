// Pure helpers for the testimonial editor: form <-> DB row and validation.
import { strings } from "../../strings";
import { changedColumns, orNull, text } from "../homepage/contentRules";

const c = strings.admin.homeContent.common.errors;
const e = strings.admin.content.testimonials.errors;

export { changedColumns };
export const testimonialFieldId = (key) => `testimonial-${key}`;
export const TESTIMONIAL_LIMITS = { name: 60, location: 60, text: 400 };

export const emptyTestimonialForm = () => ({ name: "", location: "", text: "", rating: "", photoUrl: "", isVisible: true });

export const testimonialToForm = (row) => ({
  name: text(row.name),
  location: text(row.location),
  text: text(row.text),
  rating: row.rating == null ? "" : String(row.rating),
  photoUrl: text(row.photo_url),
  isVisible: row.is_visible !== false,
});

/** Returns `{ field: message }`; empty = valid. */
export function validateTestimonial(form) {
  const errors = {};
  const name = form.name.trim();
  if (!name) errors.name = e.name;
  else if (name.length > TESTIMONIAL_LIMITS.name) errors.name = c.tooLong(TESTIMONIAL_LIMITS.name);
  if (form.location.trim().length > TESTIMONIAL_LIMITS.location) errors.location = c.tooLong(TESTIMONIAL_LIMITS.location);
  const body = form.text.trim();
  if (!body) errors.text = e.text;
  else if (body.length > TESTIMONIAL_LIMITS.text) errors.text = c.tooLong(TESTIMONIAL_LIMITS.text);
  if (form.rating !== "" && !["1", "2", "3", "4", "5"].includes(form.rating)) errors.rating = e.rating;
  return errors;
}

export const testimonialToPayload = (form) => ({
  name: form.name.trim(),
  location: orNull(form.location),
  text: form.text.trim(),
  rating: form.rating === "" ? null : Number(form.rating),
  photo_url: orNull(form.photoUrl),
  is_visible: form.isVisible,
});
