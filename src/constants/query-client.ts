import { QueryClient } from '@tanstack/react-query'

export const ONE_MINUTE = 1000 * 60
export const ONE_HOUR = ONE_MINUTE * 60
export const ONE_DAY = ONE_HOUR * 24

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
			 * Because we want to preserve hybrid network functionality, the `maxAge` is set to `Infinity`
			 *
			 * Therefore, this also needs to be set to `Infinity`
			 *
			 * @see https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient#how-it-works
			 */
			gcTime: Infinity,

			/**
			 * Refetch data after 4 hours as a default
			 */
			staleTime: ONE_HOUR * 4,

			refetchIntervalInBackground: false,

			refetchOnWindowFocus: false,

			retry(failureCount: number, error: Error) {
				if (failureCount > 2) return false

				if (error.message.includes('Network Error') || error.message.includes('Timeout'))
					return false

				return true
			},
		},
	},
})
