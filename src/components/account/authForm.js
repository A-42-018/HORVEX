import { strings } from "../../lib/strings";

// Form rules shared by the account pages (C6b).
const t = strings.account;

export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const MIN_PASSWORD = 8;

/** Copy for a Supabase Auth error (ServiceError.code), never the raw server message. */
export const authErrorText = (error) => t.authErrors[error?.code] ?? t.authErrors.generic;

/** Focuses the first field (in `order`) that has an error. */
export function focusFirstError(errors, refs, order) {
  const first = order.find((key) => errors[key]);
  if (first) refs[first]?.current?.focus();
}

/** Copy for an error that came back in an email link (#error_code=otp_expired, …). */
export const linkErrorText = (code) => (code ? (t.linkErrors[code] ?? t.linkErrors.generic) : null);

/** Field errors for an email + password pair ({} when both are fine). */
export function validateCredentials({ email, password }, { newPassword = false } = {}) {
  const errors = {};
  if (!EMAIL_PATTERN.test(email.trim())) errors.email = t.errors.email;
  if (newPassword ? password.length < MIN_PASSWORD : !password) {
    errors.password = newPassword ? t.errors.password : t.errors.passwordRequired;
  }
  return errors;
}
