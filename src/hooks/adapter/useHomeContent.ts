/**
 * Unified hooks for home screen content.
 * Works with both Jellyfin and Navidrome backends.
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useAdapter, useJellifyServer } from '../../stores'
import { UnifiedAlbum, UnifiedArtist, UnifiedTrack } from '../../api/core/types'

const HOME_QUERY_CONFIG = {
	staleTime: 60_000, // 1 minute
	refetchOnMount: false,
} as const

/**
 * Hook for fetching recent albums (recently played).
 * For Navidrome: uses getAlbums with type: 'recent'
 * For Jellyfin: the existing queries will be used separately
 */
export function useRecentAlbums(limit: number = 20): UseQueryResult<UnifiedAlbum[], Error> {
	const adapter = useAdapter()
	const [server] = useJellifyServer()

	return useQuery({
		queryKey: ['unified-home', 'recent-albums', limit],
		queryFn: async () => {
			if (!adapter) throw new Error('No adapter available')
			return adapter.getAlbums({ type: 'recent', limit })
		},
		enabled: !!adapter && server?.backend === 'navidrome',
		...HOME_QUERY_CONFIG,
	})
}

/**
 * Hook for fetching frequently played albums.
 * For Navidrome: uses getAlbums with type: 'frequent'
 */
export function useFrequentAlbums(limit: number = 20): UseQueryResult<UnifiedAlbum[], Error> {
	const adapter = useAdapter()
	const [server] = useJellifyServer()

	return useQuery({
		queryKey: ['unified-home', 'frequent-albums', limit],
		queryFn: async () => {
			if (!adapter) throw new Error('No adapter available')
			return adapter.getAlbums({ type: 'frequent', limit })
		},
		enabled: !!adapter && server?.backend === 'navidrome',
		...HOME_QUERY_CONFIG,
	})
}

/**
 * Hook for fetching newest albums (recently added).
 */
export function useNewestAlbums(limit: number = 20): UseQueryResult<UnifiedAlbum[], Error> {
	const adapter = useAdapter()
	const [server] = useJellifyServer()

	return useQuery({
		queryKey: ['unified-home', 'newest-albums', limit],
		queryFn: async () => {
			if (!adapter) throw new Error('No adapter available')
			return adapter.getAlbums({ type: 'newest', limit })
		},
		enabled: !!adapter && server?.backend === 'navidrome',
		...HOME_QUERY_CONFIG,
	})
}

/**
 * Hook for fetching random albums.
 */
export function useRandomAlbums(limit: number = 20): UseQueryResult<UnifiedAlbum[], Error> {
	const adapter = useAdapter()
	const [server] = useJellifyServer()

	return useQuery({
		queryKey: ['unified-home', 'random-albums', limit],
		queryFn: async () => {
			if (!adapter) throw new Error('No adapter available')
			return adapter.getAlbums({ type: 'random', limit })
		},
		enabled: !!adapter && server?.backend === 'navidrome',
		...HOME_QUERY_CONFIG,
	})
}

/**
 * Combined hook that fetches all home content for Navidrome.
 * Returns recent and frequent albums.
 */
export function useNavidromeHomeContent(limit: number = 10) {
	const recentAlbums = useRecentAlbums(limit)
	const frequentAlbums = useFrequentAlbums(limit)
	const newestAlbums = useNewestAlbums(limit)

	return {
		recentAlbums,
		frequentAlbums,
		newestAlbums,
		isLoading: recentAlbums.isLoading || frequentAlbums.isLoading || newestAlbums.isLoading,
		isPending: recentAlbums.isPending || frequentAlbums.isPending || newestAlbums.isPending,
		refetchAll: async () => {
			await Promise.all([
				recentAlbums.refetch(),
				frequentAlbums.refetch(),
				newestAlbums.refetch(),
			])
		},
	}
}

// =============================================================================
// Unified Track-based Hooks (work for both backends)
// =============================================================================

/**
 * Hook for fetching recently played tracks.
 * Uses adapter.getRecentTracks if available.
 */
export function useRecentTracks(limit: number = 50): UseQueryResult<UnifiedTrack[], Error> {
	const adapter = useAdapter()

	return useQuery({
		queryKey: ['unified-home', 'recent-tracks', limit],
		queryFn: async () => {
			if (!adapter) throw new Error('No adapter available')
			if (!adapter.getRecentTracks) {
				throw new Error('Recent tracks not supported by this backend')
			}
			return adapter.getRecentTracks(limit)
		},
		enabled: !!adapter && !!adapter.getRecentTracks,
		...HOME_QUERY_CONFIG,
	})
}

/**
 * Hook for fetching frequently played tracks.
 * Uses adapter.getFrequentTracks if available.
 */
export function useFrequentTracks(limit: number = 50): UseQueryResult<UnifiedTrack[], Error> {
	const adapter = useAdapter()

	return useQuery({
		queryKey: ['unified-home', 'frequent-tracks', limit],
		queryFn: async () => {
			if (!adapter) throw new Error('No adapter available')
			if (!adapter.getFrequentTracks) {
				throw new Error('Frequent tracks not supported by this backend')
			}
			return adapter.getFrequentTracks(limit)
		},
		enabled: !!adapter && !!adapter.getFrequentTracks,
		...HOME_QUERY_CONFIG,
	})
}

/**
 * Hook for fetching recently played artists.
 * Uses adapter.getRecentArtists if available.
 */
export function useUnifiedRecentArtists(
	limit: number = 20,
): UseQueryResult<UnifiedArtist[], Error> {
	const adapter = useAdapter()

	return useQuery({
		queryKey: ['unified-home', 'recent-artists', limit],
		queryFn: async () => {
			if (!adapter) throw new Error('No adapter available')
			if (!adapter.getRecentArtists) {
				throw new Error('Recent artists not supported by this backend')
			}
			return adapter.getRecentArtists(limit)
		},
		enabled: !!adapter && !!adapter.getRecentArtists,
		...HOME_QUERY_CONFIG,
	})
}

/**
 * Hook for fetching frequently played artists.
 * Uses adapter.getFrequentArtists if available.
 */
export function useUnifiedFrequentArtists(
	limit: number = 20,
): UseQueryResult<UnifiedArtist[], Error> {
	const adapter = useAdapter()

	return useQuery({
		queryKey: ['unified-home', 'frequent-artists', limit],
		queryFn: async () => {
			if (!adapter) throw new Error('No adapter available')
			if (!adapter.getFrequentArtists) {
				throw new Error('Frequent artists not supported by this backend')
			}
			return adapter.getFrequentArtists(limit)
		},
		enabled: !!adapter && !!adapter.getFrequentArtists,
		...HOME_QUERY_CONFIG,
	})
}
