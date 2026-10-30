import { QueryClient } from '@tanstack/react-query'
import { MAX_RETRY_ATTEMPTS } from '../configs/querying/index.config'
import { QueryAges } from '../constants/durations'

/**
 * A global instance of the Tanstack React Query client
 *
 * Memory management optimized for mobile devices to prevent memory buildup
 * while still maintaining good performance with MMKV persistence
 *
 * Default stale time is set to 12 hours. Users have the option
 * to refresh relevant datasets by design (i.e. refreshing
 * Discover page for more results)
 */
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			/**
			 * Disable garbage collection of inactive queries.
			 *
			 * This needs to be set greater than or equal to the `maxAge` in the persistence config
			 * to prevent data from being garbage collected from the persistence layer.
			 *
			 * The maxAge is set to `Infinity` to prevent removal of data from the persistence
			 * layer (`react-native-mmkv`).
			 */
			gcTime: Infinity,

			/**
			 * Refetch data after 12 hours as a default
			 */
			staleTime: QueryAges.OneDay / 2,

			retry(failureCount: number, error: Error) {
				if (failureCount > MAX_RETRY_ATTEMPTS) return false

				if (error.message.includes('Network Error') || /timeout/i.test(error.message))
					return false

				return true
			},
		},
	},
})
