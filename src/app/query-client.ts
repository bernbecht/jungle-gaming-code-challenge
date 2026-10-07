import { QueryClient } from '@tanstack/react-query'
import { shouldRetryQuery } from '@/lib/http'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: shouldRetryQuery,
      retryDelay: 500,
      refetchOnWindowFocus: true,
    },
    mutations: { retry: false },
  },
})
