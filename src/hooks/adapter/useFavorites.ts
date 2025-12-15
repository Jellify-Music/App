/**
 * Unified favorites hooks that work with both Jellyfin and Navidrome via the adapter.
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query'
import { useAdapter } from '../../stores'
import { UnifiedStarred, UnifiedTrack, UnifiedAlbum, UnifiedArtist } from '../../api/core/types'

const FAVORITES_QUERY_KEY = ['unified-favorites']

/**
 * Hook for fetching all starred/favorited content via the unified adapter.
 */
export function useFavorites(): UseQueryResult<UnifiedStarred, Error> {
	const adapter = useAdapter()

	return useQuery({
		queryKey: FAVORITES_QUERY_KEY,
		queryFn: async () => {
			if (!adapter) throw new Error('No adapter available')
			return adapter.getStarred()
		},
		enabled: !!adapter,
		staleTime: 60_000, // 1 minute
	})
}

/**
 * Hook for fetching favorite artists.
 */
export function useFavoriteArtists(): UseQueryResult<UnifiedArtist[], Error> {
	const adapter = useAdapter()

	return useQuery({
		queryKey: [...FAVORITES_QUERY_KEY, 'artists'],
		queryFn: async () => {
			if (!adapter) throw new Error('No adapter available')
			const starred = await adapter.getStarred()
			return starred.artists
		},
		enabled: !!adapter,
		staleTime: 60_000,
	})
}

/**
 * Hook for fetching favorite albums.
 */
export function useFavoriteAlbums(): UseQueryResult<UnifiedAlbum[], Error> {
	const adapter = useAdapter()

	return useQuery({
		queryKey: [...FAVORITES_QUERY_KEY, 'albums'],
		queryFn: async () => {
			if (!adapter) throw new Error('No adapter available')
			const starred = await adapter.getStarred()
			return starred.albums
		},
		enabled: !!adapter,
		staleTime: 60_000,
	})
}

/**
 * Hook for fetching favorite tracks.
 */
export function useFavoriteTracks(): UseQueryResult<UnifiedTrack[], Error> {
	const adapter = useAdapter()

	return useQuery({
		queryKey: [...FAVORITES_QUERY_KEY, 'tracks'],
		queryFn: async () => {
			if (!adapter) throw new Error('No adapter available')
			const starred = await adapter.getStarred()
			return starred.tracks
		},
		enabled: !!adapter,
		staleTime: 60_000,
	})
}

/**
 * Hook for starring (favoriting) an item.
 */
export function useStar() {
	const adapter = useAdapter()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (id: string) => {
			if (!adapter) throw new Error('No adapter available')
			await adapter.star(id)
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY })
		},
	})
}

/**
 * Hook for unstarring (unfavoriting) an item.
 */
export function useUnstar() {
	const adapter = useAdapter()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (id: string) => {
			if (!adapter) throw new Error('No adapter available')
			await adapter.unstar(id)
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY })
		},
	})
}

/**
 * Hook for toggling the starred state of an item.
 */
export function useToggleStar() {
	const { mutateAsync: star } = useStar()
	const { mutateAsync: unstar } = useUnstar()

	return useMutation({
		mutationFn: async ({ id, isStarred }: { id: string; isStarred: boolean }) => {
			if (isStarred) {
				await unstar(id)
			} else {
				await star(id)
			}
		},
	})
}
