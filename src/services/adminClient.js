import { createClient } from "@supabase/supabase-js";
import { createServiceHelpers, isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./supabase";

// The admin's own client: it holds the signed-in session under its own storage
// key, so the storefront client stays anonymous. Import this only from admin
// code (services/auth.js, admin.js, storage.js) so it stays in the admin chunk.
export const adminSupabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: "wristory-admin-auth",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export const { query, queryWithCount, rpc } = createServiceHelpers(adminSupabase);
