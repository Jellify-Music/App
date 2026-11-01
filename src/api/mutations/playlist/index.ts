import LibraryStackParamList from '@/src/screens/Library/types'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useMutation } from '@tanstack/react-query'
import { refreshAndroidAutoLibrary } from '../../../services/android-auto'
import { createPlaylist, deletePlaylist, updatePlaylist } from './utils/playlists'
import Toast from 'react-native-toast-message'
import {
	addUserPlaylist,
	removeCachedPlaylist,
	setPlaylistTracks,
	updateCachedPlaylist,
} from '../../queries/playlist/cache'
import { getApi } from '../../../stores/auth/utils'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import navigationRef from '../../../screens/navigation'
import { applyHapticFeedback } from '../../../utils/haptics'

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
			})

			refreshAndroidAutoLibrary()
			applyHapticFeedback('success')

			Toast.show({
				text1: 'Playlist created',
				text2: `Created playlist ${name}`,
				type: 'success',
			})

			libraryStackNavigation.goBack()
		},
		onError: () => {
			applyHapticFeedback('error')
		},
	})
}

export const useDeletePlaylist = () => {
	return useMutation({
		mutationFn: (playlist: BaseItemDto) => {
			const api = getApi()
			return deletePlaylist(api, playlist.Id!)
		},
		onSuccess: async (data: void, playlist: BaseItemDto) => {
			removeCachedPlaylist(playlist.Id!)
			refreshAndroidAutoLibrary()

			applyHapticFeedback('success')

			navigationRef.goBack() // Dismiss DeletePlaylist sheet
			navigationRef.goBack() // Pop Playlist screen or Context sheet if open
		},
		onError: () => {
			applyHapticFeedback('error')
		},
	})
}

export const useUpdatePlaylist = ({
	onSettled,
	onError,
}: {
	onSettled?: () => void
	onError?: () => void
}) => {
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
			applyHapticFeedback('success')
		},
		onError: onError,
		onSettled: onSettled,
	})
}
