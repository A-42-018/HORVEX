import { useQuery } from "@tanstack/react-query";
import { fetchDashboard } from "../../services/adminDashboard";
import { queryKeys } from "../../services/queryKeys";

const REFRESH_MS = 60_000;

/** Dashboard summary; re-reads every minute while the tab is visible. */
export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard.summary(),
    queryFn: fetchDashboard,
    staleTime: 30_000,
    refetchInterval: REFRESH_MS,
  });
}
