import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Server data cache used by every page once Supabase is wired up (Phase 2+).
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

function Providers({ children }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export default Providers;
