import { AuthClient } from "@supabase/auth-js";
import { PostgrestClient } from "@supabase/postgrest-js";
import { ServiceError, createServiceHelpers, isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./supabase";
import { CUSTOMER_AUTH_KEY } from "../lib/customerSession";

// Optional customer accounts (C6b). Import this only from the account pages
// (services/account.js, hooks/useAccount.js) so auth-js loads with that chunk;
// checkout imports it dynamically, and only when a customer is signed in.
// Separate from both the anonymous storefront client (catalog reads stay
// anon, so an admin who is also a customer still sees the shop as a visitor)
// and the admin client (own storage key). A customer is an `authenticated`
// user without an admin_profiles row, which RLS treats like anon.
const base = supabaseUrl?.replace(/\/$/, "");

// What the email link brought with it (#type=signup|recovery or #error_code=…).
// Read before the client consumes and clears the URL hash.
function readLanding() {
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const query = new URLSearchParams(window.location.search);
  const errorCode = hash.get("error_code") ?? query.get("error_code");
  return { type: hash.get("type"), errorCode: errorCode || (hash.get("error") ?? query.get("error")) };
}
let landing = readLanding();

/**
 * Returns what the email link said (signup / recovery / error) and forgets it
 * after this tick, so a later visit doesn't repeat it (calls in the same
 * render, e.g. StrictMode's double initializer, still get it).
 */
export function takeLanding() {
  const value = landing;
  setTimeout(() => {
    landing = { type: null, errorCode: null };
  });
  return value;
}

const auth = isSupabaseConfigured
  ? new AuthClient({
      url: `${base}/auth/v1`,
      headers: { Authorization: `Bearer ${supabaseAnonKey}`, apikey: supabaseAnonKey },
      storageKey: CUSTOMER_AUTH_KEY,
      persistSession: true,
      autoRefreshToken: true,
      // Implicit flow: the email link works on another device or browser
      // than the one that signed up (PKCE needs the same browser).
      flowType: "implicit",
      detectSessionInUrl: true,
    })
  : null;

// Data the customer reads as themselves: PostgREST with their access token.
async function fetchAsCustomer(input, init) {
  const { data } = await auth.getSession();
  const headers = new Headers(init?.headers);
  headers.set("apikey", supabaseAnonKey);
  headers.set("Authorization", `Bearer ${data.session?.access_token ?? supabaseAnonKey}`);
  return fetch(input, { ...init, headers });
}

const customerDb = isSupabaseConfigured ? new PostgrestClient(`${base}/rest/v1`, { fetch: fetchAsCustomer }) : null;

export const { query, rpc } = createServiceHelpers(customerDb);

function authClient() {
  if (!auth) throw new ServiceError("not_configured");
  return auth;
}

// Auth errors carry their own code (invalid_credentials, weak_password, …);
// network failures are AuthRetryableFetchError without one.
const authError = (error) =>
  new ServiceError(error.message, {
    code: error.code ?? (error.name === "AuthRetryableFetchError" ? "network" : error.name ?? error.message),
    cause: error,
  });

const redirect = (path) => `${window.location.origin}${path}`;

/**
 * Creates the account. Returns { session, needsConfirmation }. "Confirm email"
 * is off for this store, so the customer is signed in at once; if it's ever
 * switched on, there's no session until the link is clicked.
 */
export async function signUp({ name, email, password }) {
  const { data, error } = await authClient().signUp({
    email,
    password,
    options: { data: { name }, emailRedirectTo: redirect("/account") },
  });
  if (error) throw authError(error);
  return { session: data.session, needsConfirmation: !data.session };
}

export async function signIn({ email, password }) {
  const { data, error } = await authClient().signInWithPassword({ email, password });
  if (error) throw authError(error);
  return data.session;
}

/** The stored session's user (refreshed if needed), or null. */
export async function currentUser() {
  if (!auth) return null;
  const { data } = await auth.getSession();
  return data.session?.user ?? null;
}

/** Signs out this browser only. */
export async function signOut() {
  const { error } = await authClient().signOut({ scope: "local" });
  if (error) throw authError(error);
}

/** Emails a reset link that lands on /account/reset-password with a recovery session. */
export async function sendPasswordReset(email) {
  const { error } = await authClient().resetPasswordForEmail(email, { redirectTo: redirect("/account/reset-password") });
  if (error) throw authError(error);
}

export async function resendConfirmation(email) {
  const { error } = await authClient().resend({ type: "signup", email, options: { emailRedirectTo: redirect("/account") } });
  if (error) throw authError(error);
}

/** Sets a new password for the signed-in (or recovering) customer. */
export async function updatePassword(password) {
  const { error } = await authClient().updateUser({ password });
  if (error) throw authError(error);
}

/**
 * Subscribes to session changes; fires once straight away (INITIAL_SESSION,
 * after any link in the URL has been read). Returns an unsubscribe function.
 */
export function onSessionChange(callback) {
  if (!auth) {
    callback(null, "INITIAL_SESSION");
    return () => {};
  }
  const { data } = auth.onAuthStateChange((event, session) => callback(session, event));
  return () => data.subscription.unsubscribe();
}
