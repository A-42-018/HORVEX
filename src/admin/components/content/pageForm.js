// Pure helpers for the page editor: form <-> DB row, validation and store paths.
import { strings } from "../../../lib/strings";
import { changedColumns, orNull, text } from "../homepage/contentRules";

const c = strings.admin.homeContent.common.errors;
const e = strings.admin.content.pages.errors;

export { changedColumns };
export const pageFieldId = (key) => `page-${key}`;
export const PAGE_LIMITS = { title: 80, content: 20000, seoDesc: 160 };

/** Where the store shows a page: About has its own route, the rest sit under /policy. */
export const pagePath = (slug) => (slug === "about" ? "/about" : `/policy/${slug}`);

export const pageToForm = (row) => ({
  title: text(row.title),
  content: text(row.content),
  seoDesc: text(row.seo_desc),
  isPublished: row.is_published !== false,
});

/** Returns `{ field: message }`; empty = valid. */
export function validatePage(form) {
  const errors = {};
  const title = form.title.trim();
  if (!title) errors.title = e.title;
  else if (title.length > PAGE_LIMITS.title) errors.title = c.tooLong(PAGE_LIMITS.title);
  if (form.content.length > PAGE_LIMITS.content) errors.content = c.tooLong(PAGE_LIMITS.content);
  else if (form.isPublished && !form.content.trim()) errors.content = e.contentPublished;
  if (form.seoDesc.trim().length > PAGE_LIMITS.seoDesc) errors.seoDesc = c.tooLong(PAGE_LIMITS.seoDesc);
  return errors;
}

// Line endings are normalised so the stored text splits into paragraphs the same way everywhere.
export const pageToPayload = (form) => ({
  title: form.title.trim(),
  content: form.content.replace(/\r\n?/g, "\n").trim(),
  seo_desc: orNull(form.seoDesc),
  is_published: form.isPublished,
});
