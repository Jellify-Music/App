/**
 * Unified playlist hooks that work with both Jellyfin and Navidrome via the adapter.
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query'
import { useAdapter } from '../../stores'
import { UnifiedPlaylist, UnifiedTrack } from '../../api/core/types'

const PLAYLISTS_QUERY_KEY = ['unified-playlists']

/**
 * Hook for fetching all playlists via the unified adapter.
 */
export function usePlaylists(): UseQueryResult<UnifiedPlaylist[], Error> {
	const adapter = useAdapter()

	return useQuery({
		queryKey: PLAYLISTS_QUERY_KEY,
		queryFn: async () => {
			if (!adapter) throw new Error('No adapter available')
			return adapter.getPlaylists()
		},
		enabled: !!adapter,
		staleTime: 60_000, // 1 minute
	})
}

/**
 * Hook for fetching tracks in a playlist via the unified adapter.
 */
export function usePlaylistTracks(
	playlistId: string | undefined,
): UseQueryResult<UnifiedTrack[], Error> {
	const adapter = useAdapter()

	return useQuery({
		queryKey: ['unified-playlist-tracks', playlistId],
		queryFn: async () => {
			if (!adapter) throw new Error('No adapter available')
			if (!playlistId) throw new Error('No playlist ID provided')
			return adapter.getPlaylistTracks(playlistId)
		},
		enabled: !!adapter && !!playlistId,
		staleTime: 30_000, // 30 seconds
	})
}

/**
 * Hook for creating a new playlist.
 */
export function useCreatePlaylist() {
	const adapter = useAdapter()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ name, trackIds }: { name: string; trackIds?: string[] }) => {
			if (!adapter) throw new Error('No adapter available')
			return adapter.createPlaylist(name, trackIds)
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: PLAYLISTS_QUERY_KEY })
		},
	})
}

/**
 * Hook for updating a playlist (name, add tracks, remove tracks).
 */
export function useUpdatePlaylist() {
	const adapter = useAdapter()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({
			id,
			name,
			trackIdsToAdd,
			trackIndicesToRemove,
		}: {
			id: string
			name?: string
			trackIdsToAdd?: string[]
			trackIndicesToRemove?: number[]
		}) => {
			if (!adapter) throw new Error('No adapter available')
			await adapter.updatePlaylist(id, { name, trackIdsToAdd, trackIndicesToRemove })
		},
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: PLAYLISTS_QUERY_KEY })
			queryClient.invalidateQueries({ queryKey: ['unified-playlist-tracks', id] })
		},
	})
}

/**
 * Hook for adding tracks to a playlist.
 */
export function useAddToPlaylist() {
	const { mutateAsync: updatePlaylist, ...rest } = useUpdatePlaylist()

	return {
		...rest,
		mutateAsync: async (playlistId: string, trackIds: string[]) => {
			await updatePlaylist({ id: playlistId, trackIdsToAdd: trackIds })
		},
		mutate: (playlistId: string, trackIds: string[]) => {
			updatePlaylist({ id: playlistId, trackIdsToAdd: trackIds })
		},
	}
}

/**
 * Hook for deleting a playlist.
 */
export function useDeletePlaylist() {
	const adapter = useAdapter()
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (id: string) => {
			if (!adapter) throw new Error('No adapter available')
			await adapter.deletePlaylist(id)
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: PLAYLISTS_QUERY_KEY })
		},
	})
}
