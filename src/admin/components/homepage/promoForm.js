// Pure helpers for the promo banner editor: form <-> DB row and validation.
import { strings } from "../../../lib/strings";
import { isValidLink, isoToLocal, localToIso, orNull, text } from "./contentRules";

const c = strings.admin.homeContent.common.errors;
const e = strings.admin.homeContent.promo.errors;

export const promoFieldId = (key) => `promo-${key}`;
export const PROMO_LIMITS = { title: 80, subtitle: 200, link: 200 };

export const emptyPromoForm = () => ({
  title: "",
  subtitle: "",
  link: "",
  image: "",
  imageMobile: "",
  countdownTo: "",
  isActive: true,
});

export const promoToForm = (row) => ({
  title: text(row.title),
  subtitle: text(row.subtitle),
  link: text(row.link),
  image: text(row.image),
  imageMobile: text(row.image_mobile),
  countdownTo: isoToLocal(row.countdown_to),
  isActive: row.is_active !== false,
});

/**
 * Returns `{ field: message }`; empty = valid. A countdown in the past is refused
 * only when it is new or changed, so an already-ended banner can still be edited.
 */
export function validatePromo(form, { original = null, now = Date.now() } = {}) {
  const errors = {};
  if (!form.title.trim() && !form.image.trim()) errors.title = e.content;
  else if (form.title.trim().length > PROMO_LIMITS.title) errors.title = c.tooLong(PROMO_LIMITS.title);
  if (form.subtitle.trim().length > PROMO_LIMITS.subtitle) errors.subtitle = c.tooLong(PROMO_LIMITS.subtitle);

  const link = form.link.trim();
  if (link && (link.length > PROMO_LIMITS.link || !isValidLink(link))) errors.link = c.link;

  if (form.countdownTo) {
    const iso = localToIso(form.countdownTo);
    if (!iso) errors.countdownTo = e.date;
    else if (Date.parse(iso) <= now) {
      const before = original?.countdown_to ? Date.parse(original.countdown_to) : null;
      if (before !== Date.parse(iso)) errors.countdownTo = e.past;
    }
  }
  return errors;
}

export const promoToPayload = (form) => ({
  title: orNull(form.title),
  subtitle: orNull(form.subtitle),
  link: orNull(form.link),
  image: orNull(form.image),
  image_mobile: orNull(form.imageMobile),
  countdown_to: localToIso(form.countdownTo),
  is_active: form.isActive,
});

const same = (key, a, b) =>
  key === "countdown_to"
    ? (a == null ? null : Date.parse(a)) === (b == null ? null : Date.parse(b))
    : (a ?? null) === (b ?? null);

/** Only the columns that differ from the loaded row. */
export const changedPromoColumns = (payload, original) =>
  Object.fromEntries(Object.entries(payload).filter(([key, value]) => !same(key, original?.[key], value)));
