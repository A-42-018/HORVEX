// Pure rules for the announcement-bar messages ([{ text, link? }], roadmap §10).
import { strings } from "../../../lib/strings";
import { isValidLink, orNull, text } from "../homepage/contentRules";

const c = strings.admin.homeContent.common.errors;
const e = strings.admin.content.announcements.errors;

export const MAX_MESSAGES = 8;
export const ANNOUNCEMENT_LIMITS = { text: 90, link: 200 };
export const announcementFieldId = (key) => `announcement-${key}`;

export const emptyAnnouncementForm = () => ({ text: "", link: "" });
export const announcementToForm = (message) => ({ text: text(message?.text), link: text(message?.link) });

/** Returns `{ field: message }`; empty = valid. */
export function validateAnnouncement(form) {
  const errors = {};
  const body = form.text.trim();
  if (!body) errors.text = e.text;
  else if (body.length > ANNOUNCEMENT_LIMITS.text) errors.text = c.tooLong(ANNOUNCEMENT_LIMITS.text);
  const link = form.link.trim();
  if (link && (link.length > ANNOUNCEMENT_LIMITS.link || !isValidLink(link))) errors.link = c.link;
  return errors;
}

export function announcementToMessage(form) {
  const link = orNull(form.link);
  return link ? { text: form.text.trim(), link } : { text: form.text.trim() };
}

/** Messages the bar shows: it drops entries without text. */
export const shownCount = (messages) => messages.filter((m) => typeof m?.text === "string" && m.text.trim()).length;

/** New list with `message` appended (index null) or replacing the one at `index`. */
export const upsertMessage = (messages, index, message) =>
  index == null ? [...messages, message] : messages.map((m, i) => (i === index ? message : m));

export const removeMessage = (messages, index) => messages.filter((_, i) => i !== index);

export const sameMessage = (a, b) => (a?.text ?? "") === (b?.text ?? "") && (a?.link ?? null) === (b?.link ?? null);

/** Swaps the message at `index` with its neighbour (delta -1 up, +1 down); same array when it can't move. */
export function moveMessage(messages, index, delta) {
  const to = index + delta;
  if (index < 0 || index >= messages.length || to < 0 || to >= messages.length) return messages;
  const next = [...messages];
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}
