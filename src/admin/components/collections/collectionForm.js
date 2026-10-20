// Pure helpers for the collection editor: form <-> DB row, rules, schedule, validation.
import { strings } from "../../strings";
import { isValidSlug } from "../../../lib/slug";

const e = strings.admin.collections.errors;

export const fieldId = (key) => `col-${key}`;
export const LIMITS = { title: 80, description: 300 };
export const MODES = ["manual", "rules"];
export const GENDER_RULES = ["men", "women", "unisex"];
export const BADGE_RULES = ["new", "sale", "limited"];
// Rule keys the storefront understands (services/categories.js RULE_FILTERS).
const RULE_KEYS = ["category", "gender", "badge", "featured", "bestseller", "price_min", "price_max"];

export const emptyRules = () => ({ category: "", gender: "", badge: "", featured: false, bestseller: false, priceMin: "", priceMax: "" });

export const emptyForm = () => ({
  title: "",
  slug: "",
  description: "",
  banner: "",
  mode: "manual",
  isVisible: true,
  activeFrom: "",
  activeTo: "",
  rules: emptyRules(),
  extraRules: {},
});

const text = (value) => (value == null ? "" : String(value));
const pad = (n) => String(n).padStart(2, "0");

/** ISO timestamp → value for <input type="datetime-local"> in the browser's time zone. */
export function isoToLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local value → ISO string (null when empty or invalid). */
export function localToIso(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function rulesToForm(rules = {}) {
  return {
    category: text(rules.category),
    gender: text(rules.gender),
    badge: text(rules.badge),
    featured: rules.featured === true,
    bestseller: rules.bestseller === true,
    priceMin: rules.price_min == null ? "" : String(rules.price_min),
    priceMax: rules.price_max == null ? "" : String(rules.price_max),
  };
}

export function toForm(row) {
  const rules = row.rules && typeof row.rules === "object" ? row.rules : {};
  return {
    title: text(row.title),
    slug: text(row.slug),
    description: text(row.description),
    banner: text(row.banner),
    mode: row.mode === "rules" ? "rules" : "manual",
    isVisible: row.is_visible !== false,
    activeFrom: isoToLocal(row.active_from),
    activeTo: isoToLocal(row.active_to),
    rules: rulesToForm(rules),
    // Rule keys this form doesn't edit are kept as they were.
    extraRules: Object.fromEntries(Object.entries(rules).filter(([key]) => !RULE_KEYS.includes(key))),
  };
}

const wholeTaka = (value) => /^\d+$/.test(value.trim());

/** Rule form → the JSON the storefront reads (empty fields are left out). */
export function buildRules(form) {
  const r = form.rules;
  const rules = { ...form.extraRules };
  if (r.category) rules.category = r.category;
  if (r.gender) rules.gender = r.gender;
  if (r.badge) rules.badge = r.badge;
  if (r.featured) rules.featured = true;
  if (r.bestseller) rules.bestseller = true;
  if (r.priceMin.trim() !== "") rules.price_min = Number(r.priceMin);
  if (r.priceMax.trim() !== "") rules.price_max = Number(r.priceMax);
  return rules;
}

/** Plain-language summary of a rule set for the list ("Men · Sale badge · ≤ ৳2,999"). */
export function describeRules(rules = {}, { categoryName = (slug) => slug, taka = String } = {}) {
  const t = strings.admin.collections.ruleSummary;
  const parts = [];
  if (rules.category) parts.push(categoryName(rules.category));
  if (rules.gender) parts.push(t.gender[rules.gender] ?? rules.gender);
  if (rules.badge) parts.push(t.badge(rules.badge));
  if (rules.featured) parts.push(t.featured);
  if (rules.bestseller) parts.push(t.bestseller);
  if (rules.price_min != null && rules.price_max != null) parts.push(t.between(taka(rules.price_min), taka(rules.price_max)));
  else if (rules.price_min != null) parts.push(t.atLeast(taka(rules.price_min)));
  else if (rules.price_max != null) parts.push(t.atMost(taka(rules.price_max)));
  return parts.join(" · ");
}

/** Returns `{ field: message }`; empty = valid. */
export function validateForm(form, { rows = [], selfId = null } = {}) {
  const errors = {};
  const title = form.title.trim();
  if (!title) errors.title = e.title;
  else if (title.length > LIMITS.title) errors.title = e.titleLong(LIMITS.title);

  const slug = form.slug.trim();
  if (!slug) errors.slug = e.slug;
  else if (!isValidSlug(slug)) errors.slug = e.slugFormat;
  else if (rows.some((row) => row.slug === slug && row.id !== selfId)) errors.slug = e.slugTaken;

  if (form.description.trim().length > LIMITS.description) errors.description = e.tooLong(LIMITS.description);

  const from = form.activeFrom ? new Date(form.activeFrom) : null;
  const to = form.activeTo ? new Date(form.activeTo) : null;
  if (from && Number.isNaN(from.getTime())) errors.activeFrom = e.date;
  if (to && Number.isNaN(to.getTime())) errors.activeTo = e.date;
  if (!errors.activeFrom && !errors.activeTo && from && to && to <= from) errors.activeTo = e.endBeforeStart;

  if (form.mode === "rules") {
    const { priceMin, priceMax } = form.rules;
    if (priceMin.trim() !== "" && !wholeTaka(priceMin)) errors.priceMin = e.price;
    if (priceMax.trim() !== "" && !wholeTaka(priceMax)) errors.priceMax = e.price;
    if (!errors.priceMin && !errors.priceMax && priceMin.trim() !== "" && priceMax.trim() !== "" && Number(priceMin) > Number(priceMax)) {
      errors.priceMax = e.priceRange;
    }
    if (!errors.priceMin && !errors.priceMax && Object.keys(buildRules(form)).length === Object.keys(form.extraRules).length) {
      errors.rules = e.noRules;
    }
  }
  return errors;
}

const orNull = (value) => (value.trim() === "" ? null : value.trim());

export function toPayload(form) {
  return {
    title: form.title.trim(),
    slug: form.slug.trim(),
    description: orNull(form.description),
    banner: orNull(form.banner),
    mode: form.mode,
    rules: form.mode === "rules" ? buildRules(form) : {},
    active_from: localToIso(form.activeFrom),
    active_to: localToIso(form.activeTo),
    is_visible: form.isVisible,
  };
}

const sameValue = (a, b) => {
  if (a && typeof a === "object") return JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b ?? {}));
  return (a ?? null) === (b ?? null);
};
const sortKeys = (obj) => Object.fromEntries(Object.entries(obj).sort(([x], [y]) => x.localeCompare(y)));
const sameTime = (a, b) => (a == null || b == null ? a == b : new Date(a).getTime() === new Date(b).getTime());

/** Only the columns that differ from the loaded row (keeps the activity-log diff small). */
export function changedColumns(payload, original) {
  return Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => {
      if (key === "active_from" || key === "active_to") return !sameTime(value, original?.[key]);
      return !sameValue(value, original?.[key]);
    }),
  );
}

/** "scheduled" before the start, "ended" after the end, "hidden" when switched off, else "live". */
export function scheduleState(row, now = Date.now()) {
  if (!row.is_visible) return "hidden";
  if (row.active_from && new Date(row.active_from).getTime() > now) return "scheduled";
  if (row.active_to && new Date(row.active_to).getTime() <= now) return "ended";
  return "live";
}

export const sameIds = (a, b) => a.length === b.length && a.every((id, i) => id === b[i]);
