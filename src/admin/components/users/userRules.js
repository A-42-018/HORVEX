// Pure rules for the admin Users page (roadmap §10, B29c).
export const ROLES = ["owner", "manager", "staff"];
export const MAX_NAME = 80;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Cleans the add-user form. Returns { values, errors } where errors maps field → token. */
export function readUserForm({ email, name, role }) {
  const values = { email: String(email ?? "").trim().toLowerCase(), name: String(name ?? "").trim(), role };
  const errors = {};
  if (!EMAIL.test(values.email) || values.email.length > 254) errors.email = "invalid_email";
  if (!values.name || values.name.length > MAX_NAME) errors.name = "invalid_name";
  if (!ROLES.includes(values.role)) errors.role = "invalid_role";
  return { values, errors };
}

/** Maps a service error to a known token, or null. */
export const errorToken = (error, known) => (known.includes(error?.code) ? error.code : null);

export const isForbidden = (error) => error?.code === "forbidden" || error?.code === "42501";
