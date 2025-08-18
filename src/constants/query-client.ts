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
			 * This needs to be set equal to or higher than the `maxAge` set in `../App.tsx`
			 *
			 * Because data can remain on the server forever, the `maxAge` is set to `Infinity`
			 *
			 * Therefore, this also needs to be set to `Infinity`, disabling garbage collection
			 *
			 * @see https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient#how-it-works
			 */
			gcTime: Infinity,

			/**
			 * 1 hour as a default - reduced from 2 hours for better battery usage
			 */
			staleTime: 1000 * 60 * 60, // 1 hour
			retry(failureCount: number, error: Error) {
				if (failureCount > 2) return false

				if (error.message.includes('Network Error')) return false

				return true
			},
		},
	},
})
