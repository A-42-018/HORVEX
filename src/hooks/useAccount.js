import { useEffect, useSyncExternalStore } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../services/queryKeys";
import { getMyProfile, listMyOrders, saveMyProfile } from "../services/account";
import {
  onSessionChange,
  resendConfirmation,
  sendPasswordReset,
  signIn,
  signOut,
  signUp,
  updatePassword,
} from "../services/customerAuth";
import { EVENTS, track } from "../lib/analytics";

// Customer session (C6b). Only the account pages import this module, so the
// auth client loads with them. One listener for the whole app.
let current = { session: undefined, event: null }; // session undefined until the stored one is read
const listeners = new Set();
let stop = null;

function subscribe(listener) {
  listeners.add(listener);
  stop ??= onSessionChange((session, event) => {
    current = { session: session ?? null, event };
    listeners.forEach((l) => l());
  });
  return () => listeners.delete(listener);
}

const getSnapshot = () => current;

/** { session, event }: session is undefined while loading, null when signed out. */
export function useCustomerSession() {
  const state = useSyncExternalStore(subscribe, getSnapshot);
  const queryClient = useQueryClient();
  // Nothing a customer loaded may outlive their session.
  useEffect(() => {
    if (state.event === "SIGNED_OUT") queryClient.removeQueries({ queryKey: queryKeys.account.all });
  }, [state.event, queryClient]);
  return state;
}

export function useSignIn() {
  return useMutation({
    mutationFn: signIn,
    onSuccess: () => track(EVENTS.login, { method: "email" }),
  });
}

export function useSignUp() {
  return useMutation({
    mutationFn: signUp,
    onSuccess: () => track(EVENTS.signUp, { method: "email" }),
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signOut,
    onSuccess: () => queryClient.removeQueries({ queryKey: queryKeys.account.all }),
  });
}

export const usePasswordReset = () => useMutation({ mutationFn: sendPasswordReset });
export const useResendConfirmation = () => useMutation({ mutationFn: resendConfirmation });
export const useUpdatePassword = () => useMutation({ mutationFn: updatePassword });

export function useMyProfile(userId) {
  return useQuery({
    queryKey: queryKeys.account.profile(userId),
    queryFn: () => getMyProfile(userId),
    enabled: Boolean(userId),
  });
}

export function useSaveProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveMyProfile,
    onSuccess: (row) => queryClient.setQueryData(queryKeys.account.profile(row.user_id), row),
  });
}

export function useMyOrders(userId) {
  return useQuery({
    queryKey: queryKeys.account.orders(userId),
    queryFn: () => listMyOrders(),
    enabled: Boolean(userId),
  });
}
