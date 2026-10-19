import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { onSessionChange, signOut as signOutService } from "../../services/auth";
import { isAdminKey } from "../../services/queryKeys";
import { AuthContext, adminProfileQuery } from "./authContext";

function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  // undefined until the stored session has been read.
  const [session, setSession] = useState(undefined);
  const userId = session?.user?.id;

  useEffect(
    () =>
      onSessionChange((nextSession, event) => {
        setSession(nextSession ?? null);
        // Nothing an admin loaded may outlive the session.
        if (event === "SIGNED_OUT") queryClient.removeQueries({ predicate: (q) => isAdminKey(q.queryKey) });
      }),
    [queryClient],
  );

  const profile = useQuery({ ...adminProfileQuery(userId), enabled: Boolean(userId) });

  const signOut = useCallback(() => signOutService(), []);

  const value = useMemo(() => {
    let status = "admin";
    if (session === undefined || (session && profile.isPending)) status = "loading";
    else if (!session) status = "signedOut";
    else if (profile.isError) status = "error";
    else if (!profile.data) status = "denied";

    return {
      status,
      session: session ?? null,
      profile: profile.data ?? null,
      error: profile.error,
      retry: profile.refetch,
      signOut,
    };
  }, [session, profile.isPending, profile.isError, profile.data, profile.error, profile.refetch, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
