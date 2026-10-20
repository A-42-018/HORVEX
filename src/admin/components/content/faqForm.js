// Pure helpers for the FAQ editor: form <-> DB row and validation.
import { strings } from "../../../lib/strings";
import { changedColumns, orNull, text } from "../homepage/contentRules";

const c = strings.admin.homeContent.common.errors;
const e = strings.admin.content.faq.errors;

export { changedColumns };
export const faqFieldId = (key) => `faq-${key}`;
export const FAQ_LIMITS = { question: 160, answer: 1000, topic: 40 };

export const emptyFaqForm = () => ({ question: "", answer: "", topic: "", isVisible: true });

export const faqToForm = (row) => ({
  question: text(row.question),
  answer: text(row.answer),
  topic: text(row.topic),
  isVisible: row.is_visible !== false,
});

/** Returns `{ field: message }`; empty = valid. */
export function validateFaq(form) {
  const errors = {};
  const question = form.question.trim();
  if (!question) errors.question = e.question;
  else if (question.length > FAQ_LIMITS.question) errors.question = c.tooLong(FAQ_LIMITS.question);
  const answer = form.answer.trim();
  if (!answer) errors.answer = e.answer;
  else if (answer.length > FAQ_LIMITS.answer) errors.answer = c.tooLong(FAQ_LIMITS.answer);
  if (form.topic.trim().length > FAQ_LIMITS.topic) errors.topic = c.tooLong(FAQ_LIMITS.topic);
  return errors;
}

export const faqToPayload = (form) => ({
  question: form.question.trim(),
  answer: form.answer.trim(),
  topic: orNull(form.topic),
  is_visible: form.isVisible,
});
