import { createContext, useContext } from "react";
import { getAdminProfile } from "../../services/auth";
import { queryKeys } from "../../services/queryKeys";

export const AuthContext = createContext(null);

/**
 * { status, session, profile, error, retry, signOut }
 * status: "loading" | "signedOut" | "denied" (signed in, not staff) | "error" | "admin"
 */
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}

/** The profile query, shared by the provider and the login page. */
export const adminProfileQuery = (userId) => ({
  queryKey: queryKeys.auth.profile(userId),
  queryFn: () => getAdminProfile(userId),
  staleTime: Infinity,
});
