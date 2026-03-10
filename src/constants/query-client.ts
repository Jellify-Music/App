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
			 * Unused queries are garbage collected after 1 hour to save memory
			 *
			 * Data persists to AsyncStorage regardless via maxAge: Infinity,
			 * so removing unused data from memory doesn't lose it.
			 *
			 * Queries can be accessed during their staleTime window or refetched
			 * after, keeping memory footprint minimal while maintaining persistence.
			 *
			 * @see https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient#how-it-works
			 */
			gcTime: ONE_HOUR,

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
