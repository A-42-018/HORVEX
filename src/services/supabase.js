import { PostgrestClient } from "@supabase/postgrest-js";

// Only the URL and the publishable (anon) key belong in the browser; RLS
// decides what each request may read or write.
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn("Supabase isn't configured: copy .env.example to .env and fill in the URL and anon key.");
}

// The storefront client never holds a session. RLS shows admins drafts and
// hidden rows, so an owner signed in to /admin must still see the shop as a
// visitor does; the admin session lives in its own client (services/adminClient.js).
// The shop only reads tables and calls RPCs, so it talks to PostgREST directly:
// auth, storage and realtime stay in the admin chunk. The publishable key goes
// in the query string (the API gateway accepts it there) instead of headers, so
// plain reads are CORS "simple" requests and skip the preflight round trip.
function fetchWithKey(input, init) {
  const target = new URL(input instanceof Request ? input.url : input);
  target.searchParams.set("apikey", supabaseAnonKey);
  return fetch(input instanceof Request ? new Request(target, input) : target, init);
}

export const supabase = isSupabaseConfigured
  ? new PostgrestClient(`${supabaseUrl.replace(/\/$/, "")}/rest/v1`, { fetch: fetchWithKey })
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
