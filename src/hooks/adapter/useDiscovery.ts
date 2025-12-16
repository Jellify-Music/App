/**
 * Unified discovery hooks for search suggestions and artist discovery.
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useAdapter } from '../../stores'
import { UnifiedAlbum, UnifiedArtist, UnifiedTrack, UnifiedPlaylist } from '../../api/core/types'

const DISCOVERY_CONFIG = {
	staleTime: 2 * 60_000, // 2 minutes - suggestions should be fresh
} as const

// =============================================================================
// Generic Item Hook
// =============================================================================

type UnifiedItem = UnifiedTrack | UnifiedAlbum | UnifiedArtist | UnifiedPlaylist

/**
 * Hook for fetching any item by ID.
 * Works for tracks, albums, artists, and playlists.
 */
export function useItem(id: string | undefined): UseQueryResult<UnifiedItem, Error> {
	const adapter = useAdapter()

	return useQuery({
		queryKey: ['unified-item', id],
		queryFn: async () => {
			if (!adapter) throw new Error('No adapter available')
			if (!id) throw new Error('No item ID provided')
			if (!adapter.getItem) throw new Error('getItem not supported')
			return adapter.getItem(id)
		},
		enabled: !!adapter && !!id && !!adapter.getItem,
		staleTime: 5 * 60_000, // 5 minutes
	})
}

// =============================================================================
// Search Suggestions
// =============================================================================

interface SearchSuggestions {
	artists: UnifiedArtist[]
	albums: UnifiedAlbum[]
	tracks: UnifiedTrack[]
}

/**
 * Hook for fetching search suggestions based on listening history.
 * Returns recent/frequent artists, albums, and tracks.
 */
export function useSearchSuggestions(limit: number = 10): UseQueryResult<SearchSuggestions, Error> {
	const adapter = useAdapter()

	return useQuery({
		queryKey: ['unified-search-suggestions', limit],
		queryFn: async () => {
			if (!adapter) throw new Error('No adapter available')
			if (!adapter.getSearchSuggestions) {
				throw new Error('Search suggestions not supported')
			}
			return adapter.getSearchSuggestions(limit)
		},
		enabled: !!adapter && !!adapter.getSearchSuggestions,
		...DISCOVERY_CONFIG,
	})
}

// =============================================================================
// Artist Discovery
// =============================================================================

/**
 * Hook for fetching random/recommended artists for discovery.
 */
export function useDiscoverArtists(limit: number = 20): UseQueryResult<UnifiedArtist[], Error> {
	const adapter = useAdapter()

	return useQuery({
		queryKey: ['unified-discover-artists', limit],
		queryFn: async () => {
			if (!adapter) throw new Error('No adapter available')
			if (!adapter.getDiscoverArtists) {
				throw new Error('Discover artists not supported')
			}
			return adapter.getDiscoverArtists(limit)
		},
		enabled: !!adapter && !!adapter.getDiscoverArtists,
		...DISCOVERY_CONFIG,
	})
}
