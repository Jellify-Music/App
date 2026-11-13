import LibraryStackParamList from '@/src/screens/Library/types'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useMutation } from '@tanstack/react-query'
import { refreshAndroidAutoLibrary } from '../../../services/auto/android-auto'
import { refreshCarPlayLibrary } from '../../../services/auto/carplay'
import {
	addManyToPlaylist,
	createPlaylist,
	deletePlaylist,
	removeFromPlaylist,
	updatePlaylist,
} from './utils/playlists'
import Toast from 'react-native-toast-message'
import {
	addUserPlaylist,
	appendPlaylistTracks,
	removeCachedPlaylist,
	removePlaylistTracks,
	setPlaylistTracks,
	updateCachedPlaylist,
} from '../../queries/playlist/cache'
import { getApi, getUser } from '../../../stores/auth/utils'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import navigationRef from '../../../screens/navigation'
import { applyHapticFeedback } from '../../../utils/haptics'
import { handleError } from '../../../utils/errors'
import { LoggingContext } from '../../../utils/logging'
import { AddToPlaylistMutation, RemoveFromPlaylistMutation, UseUpdatePlaylistParams } from './types'

/**
 * Hook to create a new playlist
 *
 * @returns A mutation object for creating the playlist
 */
export const useAddPlaylist = () => {
	const libraryStackNavigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>()

	return useMutation({
		mutationFn: ({ name }: { name: string }) => createPlaylist(name),
		onSuccess: async (data: string, { name }: { name: string }) => {
			addUserPlaylist({
				Id: data,
				Name: name,
				CanDelete: true,
				Type: 'Playlist',
				DateCreated: new Date().toISOString(),
			})

			refreshAndroidAutoLibrary()
			refreshCarPlayLibrary('playlists')
			applyHapticFeedback('success')

			Toast.show({
				text1: 'Playlist created',
				text2: `Created playlist ${name}`,
				type: 'success',
			})

			libraryStackNavigation.goBack()
		},
		onError: (error) => {
			handleError(error, LoggingContext.Playlist, 'Failed to create playlist')
		},
	})
}

/**
 * Hook to delete a playlist
 *
 * @returns A mutation object for deleting the playlist
 */
export const useDeletePlaylist = () => {
	return useMutation({
		mutationFn: (playlist: BaseItemDto) => {
			const api = getApi()
			return deletePlaylist(api, playlist.Id!)
		},
		onSuccess: async (data: void, playlist: BaseItemDto) => {
			removeCachedPlaylist(playlist.Id!)
			refreshAndroidAutoLibrary()
			refreshCarPlayLibrary('playlists')

			applyHapticFeedback('success')

			navigationRef.goBack() // Dismiss DeletePlaylist sheet
			navigationRef.goBack() // Pop Playlist screen or Context sheet if open
		},
		onError: (error) => {
			handleError(error, LoggingContext.Playlist, 'Failed to delete playlist')
		},
	})
}

/**
 * Hook to update a playlist's tracks and name
 *
 * @param param0 The parameters for updating the playlist, including onSettled and onError handlers
 *
 * @returns A mutation object for updating the playlist
 */
export const useUpdatePlaylist = ({ onSettled, onError }: UseUpdatePlaylistParams) => {
	const api = getApi()

	return useMutation({
		mutationFn: ({
			playlist,
			tracks,
			newName,
		}: {
			playlist: BaseItemDto
			tracks: BaseItemDto[]
			newName: string
		}) => {
			return updatePlaylist(
				api,
				playlist.Id!,
				newName,
				tracks.map((track) => track.Id!),
			)
		},
		onSuccess: (_, { playlist, tracks, newName }) => {
			setPlaylistTracks(playlist, tracks)
			updateCachedPlaylist(playlist.Id!, { Name: newName })

			refreshAndroidAutoLibrary()
			refreshCarPlayLibrary('playlists')
			refreshCarPlayLibrary(`playlist:${playlist.Id}`)
			applyHapticFeedback('success')
		},
		onError: (error) => {
			handleError(error, LoggingContext.Playlist, 'Failed to update playlist')
			onError?.()
		},
		onSettled: onSettled,
	})
}

/**
 * Hook to add tracks to a playlist
 *
 * @param playlist The playlist to add tracks to
 *
 * @returns A mutation object for adding tracks to the playlist
 *
 */
export const useAddToPlaylist = (playlist: BaseItemDto) =>
	useMutation({
		mutationFn: ({ playlist, tracks }: AddToPlaylistMutation) => {
			applyHapticFeedback('info')

			const api = getApi()
			const user = getUser()

			return addManyToPlaylist(api, user, tracks, playlist)
		},
		onSuccess: (_, { tracks }) => {
			applyHapticFeedback('success')

			appendPlaylistTracks(playlist, tracks)
		},
		onError: (error) => {
			handleError(
				error,
				LoggingContext.Playlist,
				`Failed to add to ${playlist.Name ?? 'playlist'}`,
			)
		},
	})

/**
 * Hook to remove tracks from a playlist
 *
 * @param playlist The playlist to remove tracks from
 *
 * @returns A mutation object for removing tracks from the playlist
 */
export const useRemoveFromPlaylist = (playlist: BaseItemDto) =>
	useMutation({
		mutationFn: ({ playlist, tracks }: RemoveFromPlaylistMutation) => {
			applyHapticFeedback('info')

			return removeFromPlaylist(tracks, playlist)
		},
		onSuccess: (_, { tracks }) => {
			applyHapticFeedback('success')

			removePlaylistTracks(playlist, tracks)
		},
		onError: (error) => {
			handleError(
				error,
				LoggingContext.Playlist,
				`Failed to remove from ${playlist.Name ?? 'playlist'}`,
			)
		},
	})
