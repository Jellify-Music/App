/**
 * Unified browsing hooks for artists, albums, and tracks via the adapter.
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useAdapter } from '../../stores'
import {
	UnifiedAlbum,
	UnifiedArtist,
	UnifiedTrack,
	AlbumQueryOptions,
	TrackQueryOptions,
} from '../../api/core/types'

// =============================================================================
// Artists
// =============================================================================

/**
 * Hook for fetching all artists via the unified adapter.
 */
export function useArtists(libraryId?: string): UseQueryResult<UnifiedArtist[], Error> {
	const adapter = useAdapter()

	return useQuery({
		queryKey: ['unified-artists', libraryId],
		queryFn: async () => {
			if (!adapter) throw new Error('No adapter available')
			return adapter.getArtists(libraryId)
		},
		enabled: !!adapter,
		staleTime: 5 * 60_000, // 5 minutes
	})
}

/**
 * Hook for fetching a single artist by ID.
 */
export function useArtist(id: string | undefined): UseQueryResult<UnifiedArtist, Error> {
	const adapter = useAdapter()

	return useQuery({
		queryKey: ['unified-artist', id],
		queryFn: async () => {
			if (!adapter) throw new Error('No adapter available')
			if (!id) throw new Error('No artist ID provided')
			return adapter.getArtist(id)
		},
		enabled: !!adapter && !!id,
		staleTime: 5 * 60_000, // 5 minutes
	})
}

/**
 * Hook for fetching albums by a specific artist.
 */
export function useArtistAlbums(
	artistId: string | undefined,
): UseQueryResult<UnifiedAlbum[], Error> {
	const adapter = useAdapter()

	return useQuery({
		queryKey: ['unified-artist-albums', artistId],
		queryFn: async () => {
			if (!adapter) throw new Error('No adapter available')
			if (!artistId) throw new Error('No artist ID provided')
			return adapter.getArtistAlbums(artistId)
		},
		enabled: !!adapter && !!artistId,
		staleTime: 5 * 60_000, // 5 minutes
	})
}

// =============================================================================
// Albums
// =============================================================================

/**
 * Hook for fetching albums with optional filtering/sorting.
 */
export function useAlbums(options?: AlbumQueryOptions): UseQueryResult<UnifiedAlbum[], Error> {
	const adapter = useAdapter()

	return useQuery({
		queryKey: ['unified-albums', options],
		queryFn: async () => {
			if (!adapter) throw new Error('No adapter available')
			return adapter.getAlbums(options)
		},
		enabled: !!adapter,
		staleTime: 2 * 60_000, // 2 minutes
	})
}

/**
 * Hook for fetching a single album by ID.
 */
export function useAlbum(id: string | undefined): UseQueryResult<UnifiedAlbum, Error> {
	const adapter = useAdapter()

	return useQuery({
		queryKey: ['unified-album', id],
		queryFn: async () => {
			if (!adapter) throw new Error('No adapter available')
			if (!id) throw new Error('No album ID provided')
			return adapter.getAlbum(id)
		},
		enabled: !!adapter && !!id,
		staleTime: 5 * 60_000, // 5 minutes
	})
}

/**
 * Hook for fetching tracks in an album.
 */
export function useAlbumTracks(albumId: string | undefined): UseQueryResult<UnifiedTrack[], Error> {
	const adapter = useAdapter()

	return useQuery({
		queryKey: ['unified-album-tracks', albumId],
		queryFn: async () => {
			if (!adapter) throw new Error('No adapter available')
			if (!albumId) throw new Error('No album ID provided')
			return adapter.getAlbumTracks(albumId)
		},
		enabled: !!adapter && !!albumId,
		staleTime: 5 * 60_000, // 5 minutes
	})
}

// =============================================================================
// Tracks
// =============================================================================

/**
 * Hook for fetching tracks with optional filtering.
 */
export function useTracks(options?: TrackQueryOptions): UseQueryResult<UnifiedTrack[], Error> {
	const adapter = useAdapter()

	return useQuery({
		queryKey: ['unified-tracks', options],
		queryFn: async () => {
			if (!adapter) throw new Error('No adapter available')
			return adapter.getTracks(options)
		},
		enabled: !!adapter,
		staleTime: 2 * 60_000, // 2 minutes
	})
}

/**
 * Hook for fetching a single track by ID.
 */
export function useTrack(id: string | undefined): UseQueryResult<UnifiedTrack, Error> {
	const adapter = useAdapter()

	return useQuery({
		queryKey: ['unified-track', id],
		queryFn: async () => {
			if (!adapter) throw new Error('No adapter available')
			if (!id) throw new Error('No track ID provided')
			return adapter.getTrack(id)
		},
		enabled: !!adapter && !!id,
		staleTime: 5 * 60_000, // 5 minutes
	})
}

// =============================================================================
// Instant Mix / Similar
// =============================================================================

/**
 * Hook for fetching an instant mix based on a seed item (track, album, or artist).
 */
export function useInstantMix(
	seedId: string | undefined,
	limit?: number,
): UseQueryResult<UnifiedTrack[], Error> {
	const adapter = useAdapter()

	return useQuery({
		queryKey: ['unified-instant-mix', seedId, limit],
		queryFn: async () => {
			if (!adapter) throw new Error('No adapter available')
			if (!seedId) throw new Error('No seed ID provided')
			if (!adapter.getInstantMix) throw new Error('Instant mix not supported')
			return adapter.getInstantMix(seedId, limit)
		},
		enabled: !!adapter && !!seedId && !!adapter.getInstantMix,
		staleTime: 0, // Always fresh for mixes
	})
}

/**
 * Hook for fetching similar artists.
 */
export function useSimilarArtists(
	artistId: string | undefined,
): UseQueryResult<UnifiedArtist[], Error> {
	const adapter = useAdapter()

	return useQuery({
		queryKey: ['unified-similar-artists', artistId],
		queryFn: async () => {
			if (!adapter) throw new Error('No adapter available')
			if (!artistId) throw new Error('No artist ID provided')
			if (!adapter.getSimilarArtists) throw new Error('Similar artists not supported')
			return adapter.getSimilarArtists(artistId)
		},
		enabled: !!adapter && !!artistId && !!adapter.getSimilarArtists,
		staleTime: 5 * 60_000, // 5 minutes
	})
}

// =============================================================================
// Album Discs (for multi-disc albums)
// =============================================================================

/**
 * Disc section with tracks for display in SectionList.
 */
export interface DiscSection {
	disc: number
	tracks: UnifiedTrack[]
}

/**
 * Hook for fetching album tracks grouped by disc number.
 * Falls back to getAlbumTracks if getAlbumDiscs is not available.
 */
export function useAlbumDiscs(albumId: string | undefined): UseQueryResult<DiscSection[], Error> {
	const adapter = useAdapter()

	return useQuery({
		queryKey: ['unified-album-discs', albumId],
		queryFn: async () => {
			if (!adapter) throw new Error('No adapter available')
			if (!albumId) throw new Error('No album ID provided')

			// Use specialized method if available
			if (adapter.getAlbumDiscs) {
				return adapter.getAlbumDiscs(albumId)
			}

			// Fall back to flat track list, group by discNumber
			const tracks = await adapter.getAlbumTracks(albumId)

			// Group by disc number (default to 1 if not set)
			const discMap = new Map<number, UnifiedTrack[]>()

			for (const track of tracks) {
				const discNum = track.discNumber ?? 1
				if (!discMap.has(discNum)) {
					discMap.set(discNum, [])
				}
				discMap.get(discNum)!.push(track)
			}

			// Sort discs and tracks
			const discs = Array.from(discMap.entries())
				.sort(([a], [b]) => a - b)
				.map(([disc, discTracks]) => ({
					disc,
					tracks: discTracks.sort((a, b) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0)),
				}))

			return discs
		},
		enabled: !!adapter && !!albumId,
		staleTime: 5 * 60_000, // 5 minutes
	})
}
