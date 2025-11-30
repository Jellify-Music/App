/**
 * Playlist mutation hooks with proper cache invalidation.
 *
 * These hooks wrap the underlying API functions and handle:
 * - Optimistic updates where appropriate
 * - Cache invalidation after successful mutations
 * - Haptic feedback for user interactions
 * - Error handling with toast notifications
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import {
	addToPlaylist,
	addManyToPlaylist,
	removeFromPlaylist,
	createPlaylist,
	deletePlaylist,
	updatePlaylist,
	reorderPlaylist,
} from '../playlists'
import { useApi, useJellifyLibrary, useJellifyUser } from '../../../stores'
import useHapticFeedback from '../../../hooks/use-haptic-feedback'
import { PlaylistTracksQueryKey, UserPlaylistsQueryKey } from '../../queries/playlist/keys'
import Toast from 'react-native-toast-message'

/**
 * Hook for adding tracks to a playlist.
 * Automatically invalidates the playlist tracks cache on success.
 */
export const useAddToPlaylist = () => {
	const api = useApi()
	const [user] = useJellifyUser()
	const queryClient = useQueryClient()
	const trigger = useHapticFeedback()

	return useMutation({
		mutationFn: async ({
			tracks,
			playlist,
		}: {
			tracks: BaseItemDto[]
			playlist: BaseItemDto
		}) => {
			trigger('impactLight')
			if (tracks.length > 1) {
				return addManyToPlaylist(api, user, tracks, playlist)
			}
			return addToPlaylist(api, user, tracks[0], playlist)
		},
		onSuccess: (_, { playlist }) => {
			trigger('notificationSuccess')
			// Invalidate the playlist tracks cache
			queryClient.invalidateQueries({
				queryKey: PlaylistTracksQueryKey(playlist.Id!),
			})
		},
		onError: () => {
			trigger('notificationError')
			Toast.show({
				text1: 'Unable to add to playlist',
				type: 'error',
			})
		},
	})
}

/**
 * Hook for removing a track from a playlist.
 */
export const useRemoveFromPlaylist = () => {
	const api = useApi()
	const queryClient = useQueryClient()
	const trigger = useHapticFeedback()

	return useMutation({
		mutationFn: async ({ track, playlist }: { track: BaseItemDto; playlist: BaseItemDto }) => {
			trigger('impactLight')
			return removeFromPlaylist(api, track, playlist)
		},
		onSuccess: (_, { playlist }) => {
			trigger('notificationSuccess')
			queryClient.invalidateQueries({
				queryKey: PlaylistTracksQueryKey(playlist.Id!),
			})
		},
		onError: () => {
			trigger('notificationError')
			Toast.show({
				text1: 'Unable to remove from playlist',
				type: 'error',
			})
		},
	})
}

/**
 * Hook for creating a new playlist.
 * Automatically invalidates the user playlists cache on success.
 */
export const useCreatePlaylist = () => {
	const api = useApi()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()
	const queryClient = useQueryClient()
	const trigger = useHapticFeedback()

	return useMutation({
		mutationFn: async ({ name }: { name: string }) => {
			trigger('impactLight')
			return createPlaylist(api, user, name)
		},
		onSuccess: (_, { name }) => {
			trigger('notificationSuccess')
			Toast.show({
				text1: 'Playlist created',
				text2: `Created playlist ${name}`,
				type: 'success',
			})
			// Invalidate user playlists to show the new playlist
			queryClient.invalidateQueries({
				queryKey: UserPlaylistsQueryKey(library),
			})
		},
		onError: () => {
			trigger('notificationError')
			Toast.show({
				text1: 'Unable to create playlist',
				type: 'error',
			})
		},
	})
}

/**
 * Hook for deleting a playlist.
 * Automatically invalidates the user playlists cache on success.
 */
export const useDeletePlaylist = () => {
	const api = useApi()
	const [library] = useJellifyLibrary()
	const queryClient = useQueryClient()
	const trigger = useHapticFeedback()

	return useMutation({
		mutationFn: async ({ playlistId }: { playlistId: string }) => {
			trigger('impactLight')
			return deletePlaylist(api, playlistId)
		},
		onSuccess: (_, { playlistId }) => {
			trigger('notificationSuccess')
			Toast.show({
				text1: 'Playlist deleted',
				type: 'success',
			})
			// Invalidate user playlists
			queryClient.invalidateQueries({
				queryKey: UserPlaylistsQueryKey(library),
			})
			// Remove the deleted playlist's tracks from cache
			queryClient.removeQueries({
				queryKey: PlaylistTracksQueryKey(playlistId),
			})
		},
		onError: () => {
			trigger('notificationError')
			Toast.show({
				text1: 'Unable to delete playlist',
				type: 'error',
			})
		},
	})
}

/**
 * Hook for updating a playlist (name and/or track order).
 */
export const useUpdatePlaylist = () => {
	const api = useApi()
	const queryClient = useQueryClient()
	const trigger = useHapticFeedback()

	return useMutation({
		mutationFn: async ({
			playlistId,
			name,
			trackIds,
		}: {
			playlistId: string
			name: string
			trackIds: string[]
		}) => {
			return updatePlaylist(api, playlistId, name, trackIds)
		},
		onSuccess: (_, { playlistId }) => {
			trigger('notificationSuccess')
			queryClient.invalidateQueries({
				queryKey: PlaylistTracksQueryKey(playlistId),
			})
		},
		onError: () => {
			trigger('notificationError')
			Toast.show({
				text1: 'Unable to update playlist',
				type: 'error',
			})
		},
	})
}

/**
 * Hook for reordering a track within a playlist.
 */
export const useReorderPlaylist = () => {
	const api = useApi()
	const queryClient = useQueryClient()
	const trigger = useHapticFeedback()

	return useMutation({
		mutationFn: async ({
			playlistId,
			itemId,
			newIndex,
		}: {
			playlistId: string
			itemId: string
			newIndex: number
		}) => {
			return reorderPlaylist(api, playlistId, itemId, newIndex)
		},
		onSuccess: (_, { playlistId }) => {
			trigger('notificationSuccess')
			queryClient.invalidateQueries({
				queryKey: PlaylistTracksQueryKey(playlistId),
			})
		},
		onError: () => {
			trigger('notificationError')
			Toast.show({
				text1: 'Unable to reorder playlist',
				type: 'error',
			})
		},
	})
}
