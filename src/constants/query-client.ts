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
			 * Invoke garbage collection after `ONE_DAY`.
			 *
			 * This needs to be set greater than or equal to the `maxAge` in the persistence config
			 * to prevent data from being garbage collected from the persistence layer.
			 *
			 * The maxAge is set to `ONE_DAY` to prevent removal of data from the persistence
			 * layer (`react-native-async-storage`).
			 */
			gcTime: ONE_DAY,

			/**
			 * Refetch data after 4 hours as a default
			 */
			staleTime: ONE_HOUR * 4,

			retry(failureCount: number, error: Error) {
				if (failureCount > 2) return false

				if (error.message.includes('Network Error') || error.message.includes('Timeout'))
					return false

				return true
			},
		},
	},
})
