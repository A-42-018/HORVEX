import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Server data cache. Query keys come from services/queryKeys.js; hooks live in
// hooks/useCatalog.js, useContent.js and useOrders.js.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      // Retry network blips only. A ServiceError with a code (RLS, bad filter,
      // missing config) fails the same way every time.
      retry: (failureCount, error) => failureCount < 2 && !error?.code,
    },
  },
});

function Providers({ children }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export default Providers;
