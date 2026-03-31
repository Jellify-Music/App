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
			 * Garbage collect unused query data from memory after 5 minutes of inactivity
			 *
			 * The maxAge is set to `Infinity` to prevent removal of data from the persistence
			 * layer (`react-native-async-storage`).
			 */
			gcTime: ONE_MINUTE * 15,

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
