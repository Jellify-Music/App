import { QueryClient } from '@tanstack/react-query'

/**
 * A global instance of the Tanstack React Query client
 *
 * Garbage collection is disabled by default, as we are using MMKV
 * as a client persister. This may need to be re-evaluated
 * at some point if storage usage becomes a problem
 *
 * Default stale time is set to 1 hour. Users have the option
 * to refresh relevant datasets by design (i.e. refreshing
 * Discover page for more results)
 */
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			/**
			 * Infinity, this needs to be greater than
			 * or higher than the `maxAge` set in App.tsx
			 */
			gcTime: Infinity,

			/**
			 * 2 hours as a default.
			 */
			staleTime: 1000 * 60 * 60 * 2, // 2 hours
			retry(failureCount, error) {
				if (failureCount > 2) return false

				if (error.message.includes('Network Error')) return false

				return true
			},
		},
	},
})
