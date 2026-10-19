import { createClient } from "@supabase/supabase-js";

// Only the URL and the publishable (anon) key belong in the browser; RLS
// decides what each request may read or write.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn("Supabase isn't configured: copy .env.example to .env and fill in the URL and anon key.");
}

/** Creates a client for this project. The admin builds its own one in services/adminClient.js. */
export const createSupabaseClient = (authOptions) =>
  isSupabaseConfigured ? createClient(url, anonKey, { auth: authOptions }) : null;

// The storefront client never holds a session. RLS shows admins drafts and
// hidden rows, so an owner signed in to /admin must still see the shop as a
// visitor does; the admin session lives in its own client and storage key.
export const supabase = createSupabaseClient({
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false,
});

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

/** Binds query() / queryWithCount() / rpc() to a client. */
export function createServiceHelpers(supabaseClient) {
  function client() {
    if (!supabaseClient) throw new ServiceError("not_configured");
    return supabaseClient;
  }

  async function run(build) {
    const result = await build(client());
    if (result.error) {
      const { message, code, details } = result.error;
      throw new ServiceError(message, { code, details, cause: result.error });
    }
    return result;
  }

  return {
    /** Runs a query builder against the client and returns `data`, or throws a ServiceError. */
    query: async (build) => (await run(build)).data,

    /** Same as query() for selects made with `{ count: "exact" }`: returns { data, count }. */
    async queryWithCount(build) {
      const { data, count } = await run(build);
      return { data, count };
    },

    /** Calls an RPC. Order-engine errors keep their snake_case token as `code`. */
    async rpc(name, args) {
      const { data, error } = await client().rpc(name, args);
      if (error) {
        throw new ServiceError(error.message, { code: error.message, details: error.details, cause: error });
      }
      return data;
    },
  };
}

export const { query, queryWithCount, rpc } = createServiceHelpers(supabase);
