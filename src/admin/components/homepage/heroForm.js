// Pure helpers for the hero slide editor: form <-> DB row and validation.
import { strings } from "../../strings";
import { isValidLink, isoToLocal, localToIso, orNull, starsBalanced, text } from "./contentRules";

const c = strings.admin.homeContent.common.errors;
const e = strings.admin.homeContent.hero.errors;

export const heroFieldId = (key) => `hero-${key}`;
export const HERO_LIMITS = { eyebrow: 40, title: 80, subtitle: 200, ctaLabel: 30, ctaLink: 200 };

export const emptyHeroForm = () => ({
  eyebrow: "",
  title: "",
  subtitle: "",
  ctaLabel: "",
  ctaLink: "",
  imageDesktop: "",
  imageMobile: "",
  isActive: true,
  activeFrom: "",
  activeTo: "",
});

export const heroToForm = (row) => ({
  eyebrow: text(row.eyebrow),
  title: text(row.title),
  subtitle: text(row.subtitle),
  ctaLabel: text(row.cta_label),
  ctaLink: text(row.cta_link),
  imageDesktop: text(row.image_desktop),
  imageMobile: text(row.image_mobile),
  isActive: row.is_active !== false,
  activeFrom: isoToLocal(row.active_from),
  activeTo: isoToLocal(row.active_to),
});

/** Returns `{ field: message }`; empty = valid. */
export function validateHero(form) {
  const errors = {};
  for (const key of ["eyebrow", "subtitle", "ctaLabel"]) {
    if (form[key].trim().length > HERO_LIMITS[key]) errors[key] = c.tooLong(HERO_LIMITS[key]);
  }

  const title = form.title.trim();
  if (!title) errors.title = e.title;
  else if (title.length > HERO_LIMITS.title) errors.title = c.tooLong(HERO_LIMITS.title);
  else if (!starsBalanced(title)) errors.title = c.stars;

  if (!form.imageDesktop.trim()) errors.imageDesktop = e.imageDesktop;

  const label = form.ctaLabel.trim();
  const link = form.ctaLink.trim();
  if (Boolean(label) !== Boolean(link)) errors[label ? "ctaLink" : "ctaLabel"] = e.ctaPair;
  else if (link && (link.length > HERO_LIMITS.ctaLink || !isValidLink(link))) errors.ctaLink = c.link;

  const from = form.activeFrom ? localToIso(form.activeFrom) : null;
  const to = form.activeTo ? localToIso(form.activeTo) : null;
  if (form.activeFrom && !from) errors.activeFrom = e.date;
  if (form.activeTo && !to) errors.activeTo = e.date;
  if (from && to && Date.parse(to) <= Date.parse(from)) errors.activeTo = e.dates;
  return errors;
}

export const heroToPayload = (form) => ({
  eyebrow: orNull(form.eyebrow),
  title: form.title.trim(),
  subtitle: orNull(form.subtitle),
  cta_label: orNull(form.ctaLabel),
  cta_link: orNull(form.ctaLink),
  image_desktop: orNull(form.imageDesktop),
  image_mobile: orNull(form.imageMobile),
  is_active: form.isActive,
  active_from: localToIso(form.activeFrom),
  active_to: localToIso(form.activeTo),
});

// Timestamps compare as instants, not strings (the DB returns "+00:00", toISOString "Z").
const same = (key, a, b) =>
  key === "active_from" || key === "active_to"
    ? (a == null ? null : Date.parse(a)) === (b == null ? null : Date.parse(b))
    : (a ?? null) === (b ?? null);

/** Only the columns that differ from the loaded row. */
export const changedHeroColumns = (payload, original) =>
  Object.fromEntries(Object.entries(payload).filter(([key, value]) => !same(key, original?.[key], value)));
