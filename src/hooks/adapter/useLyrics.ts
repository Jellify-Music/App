/**
 * Unified hooks for lyrics via the adapter.
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useAdapter } from '../../stores'
import { UnifiedLyrics } from '../../api/core/types'

/**
 * Hook for fetching lyrics for a track via the unified adapter.
 */
export function useLyrics(
	trackId: string | undefined,
): UseQueryResult<UnifiedLyrics | null, Error> {
	const adapter = useAdapter()

	return useQuery({
		queryKey: ['unified-lyrics', trackId],
		queryFn: async () => {
			if (!adapter) throw new Error('No adapter available')
			if (!trackId) throw new Error('No track ID provided')
			if (!adapter.getLyrics) return null
			return adapter.getLyrics(trackId)
		},
		enabled: !!adapter && !!trackId && !!adapter.getLyrics,
		staleTime: 60 * 60_000, // 1 hour (lyrics don't change often)
	})
}

export default useLyrics
