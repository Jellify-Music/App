/**
 * Unified search hook that works with both Jellyfin and Navidrome via the adapter.
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useAdapter } from '../../stores'
import { UnifiedSearchResults, SearchOptions } from '../../api/core/types'

export interface UseSearchOptions extends SearchOptions {
	enabled?: boolean
}

/**
 * Hook for searching artists, albums, tracks, and playlists via the unified adapter.
 * Works identically for both Jellyfin and Navidrome backends.
 */
export function useSearch(
	query: string,
	options?: UseSearchOptions,
): UseQueryResult<UnifiedSearchResults, Error> {
	const adapter = useAdapter()
	const { enabled = true, ...searchOptions } = options ?? {}

	return useQuery({
		queryKey: ['unified-search', query, searchOptions],
		queryFn: async () => {
			if (!adapter) throw new Error('No adapter available')
			return adapter.search(query.trim(), searchOptions)
		},
		enabled: enabled && !!adapter && query.trim().length > 0,
		staleTime: 30_000, // 30 seconds
	})
}

export default useSearch
