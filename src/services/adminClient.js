import { createServiceHelpers, createSupabaseClient } from "./supabase";

// The admin's own client: it holds the signed-in session under its own storage
// key, so the storefront client stays anonymous. Import this only from admin
// code (services/auth.js, admin.js, storage.js) so it stays in the admin chunk.
export const adminSupabase = createSupabaseClient({
  storageKey: "wristory-admin-auth",
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: false,
});

export const { query, queryWithCount, rpc } = createServiceHelpers(adminSupabase);
