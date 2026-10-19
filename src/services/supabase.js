import { createClient } from "@supabase/supabase-js";

// The one browser client. Only the URL and the publishable (anon) key belong
// here; RLS decides what each request may read or write.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn("Supabase isn't configured: copy .env.example to .env and fill in the URL and anon key.");
}

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

/**
 * Error thrown by every service. `code` is the server's stable token
 * (e.g. "out_of_stock" from place_order) or a Postgres/PostgREST code.
 */
export class ServiceError extends Error {
  constructor(message, { code, details, cause } = {}) {
    super(message, { cause });
    this.name = "ServiceError";
    this.code = code ?? message;
    this.details = details ?? null;
  }
}

function client() {
  if (!supabase) throw new ServiceError("not_configured");
  return supabase;
}

async function run(build) {
  const result = await build(client());
  if (result.error) {
    const { message, code, details } = result.error;
    throw new ServiceError(message, { code, details, cause: result.error });
  }
  return result;
}

/** Runs a query builder against the client and returns `data`, or throws a ServiceError. */
export const query = async (build) => (await run(build)).data;

/** Same as query() for selects made with `{ count: "exact" }`: returns { data, count }. */
export async function queryWithCount(build) {
  const { data, count } = await run(build);
  return { data, count };
}

/** Calls a public RPC. Order-engine errors keep their snake_case token as `code`. */
export async function rpc(name, args) {
  const { data, error } = await client().rpc(name, args);
  if (error) {
    throw new ServiceError(error.message, { code: error.message, details: error.details, cause: error });
  }
  return data;
}
