import { adminSupabase, query } from "./adminClient";
import { ServiceError } from "./supabase";

// Admin sign-in (Supabase Auth, email + password). Access itself is decided by
// an admin_profiles row: a signed-in user without one is treated like anon.

function authClient() {
  if (!adminSupabase) throw new ServiceError("not_configured");
  return adminSupabase.auth;
}

// Auth errors carry their own code (invalid_credentials, over_request_rate_limit, …).
const authError = (error) =>
  new ServiceError(error.message, { code: error.code ?? error.name ?? error.message, cause: error });

/** Signs in and returns the session. */
export async function signIn(email, password) {
  const { data, error } = await authClient().signInWithPassword({ email, password });
  if (error) throw authError(error);
  return data.session;
}

/** Signs out this browser only; other devices keep their sessions. */
export async function signOut() {
  const { error } = await authClient().signOut({ scope: "local" });
  if (error) throw authError(error);
}

/**
 * Subscribes to session changes. Fires once straight away with the stored
 * session (INITIAL_SESSION). Returns an unsubscribe function.
 */
export function onSessionChange(callback) {
  if (!adminSupabase) {
    callback(null);
    return () => {};
  }
  const { data } = adminSupabase.auth.onAuthStateChange((event, session) => callback(session, event));
  return () => data.subscription.unsubscribe();
}

/** The user's admin profile ({ user_id, name, role }), or null when they aren't staff. */
export const getAdminProfile = (userId) =>
  query((db) => db.from("admin_profiles").select("user_id, name, role").eq("user_id", userId).maybeSingle());
