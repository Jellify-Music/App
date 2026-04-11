import { QueryClient } from '@tanstack/react-query'

/**
 * Creates a QueryClient configured for deterministic testing.
 * - No retries (immediate failure)
 * - Zero garbage collection time (no stale cache between tests)
 */
export function createTestQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				gcTime: 0,
			},
			mutations: {
				retry: false,
			},
		},
	})
}
