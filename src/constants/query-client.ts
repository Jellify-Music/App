import { QueryClient } from '@tanstack/react-query'

/**
 * A global instance of the Tanstack React Query client
 *
 * Memory management optimized for mobile devices to prevent memory buildup
 * while still maintaining good performance with MMKV persistence
 *
 * Default stale time is set to 1 hour. Users have the option
 * to refresh relevant datasets by design (i.e. refreshing
 * Discover page for more results)
 */
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			/**
			 * 30 minutes GC time for better memory management
			 * This prevents excessive memory usage while still keeping
			 * recent data in memory for performance
			 */
			gcTime: 1000 * 60 * 30, // 30 minutes

			/**
			 * 1 hour as a default - reduced from 2 hours for better battery usage
			 */
			staleTime: 1000 * 60 * 60, // 1 hour
			retry(failureCount, error) {
				if (failureCount > 2) return false

				if (error.message.includes('Network Error')) return false

				return true
			},
		},
	},
})
