import LibraryStackParamList from '@/src/screens/Library/types'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { InfiniteData, useMutation } from '@tanstack/react-query'
import { Presets } from 'react-native-pulsar'
import { createPlaylist, deletePlaylist, updatePlaylist } from './utils/playlists'
import Toast from 'react-native-toast-message'
import { queryClient } from '../../../constants/query-client'
import { PlaylistTracksQueryKey, UserPlaylistsQueryKey } from '../../queries/playlist/keys'
import { ensurePlaylistLibraryQueryData } from '../../queries/libraries'
import { getApi, getUser } from '../../../stores'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import navigationRef from '../../../screens/navigation'

export const useAddPlaylist = () => {
	const user = getUser()

	const libraryStackNavigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>()

	return useMutation({
		mutationFn: ({ name }: { name: string }) => createPlaylist(name),
		onSuccess: async (data: string, { name }: { name: string }) => {
			Presets.castanets()

			Toast.show({
				text1: 'Playlist created',
				text2: `Created playlist ${name}`,
				type: 'success',
			})

			libraryStackNavigation.goBack()

			const playlistLibrary = await ensurePlaylistLibraryQueryData()

			// Refresh user playlists component in library
			if (playlistLibrary)
				queryClient.setQueryData<InfiniteData<BaseItemDto[]>>(
					UserPlaylistsQueryKey(playlistLibrary, user),
					(oldData) => {
						if (!oldData) return oldData

						const newPlaylist: BaseItemDto = {
							Id: data,
							Name: name,
							CanDelete: true,
							Type: 'Playlist',
						} as BaseItemDto

						return {
							...oldData,
							pages: oldData.pages.map((page, index) =>
								index === 0 ? [newPlaylist, ...page] : page,
							),
						}
					},
				)
		},
		onError: () => {
			Presets.glitch()
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
			const user = getUser()

			Presets.castanets()

			navigationRef.goBack() // Dismiss DeletePlaylist sheet
			navigationRef.goBack() // Pop Playlist screen or Context sheet if open

			const playlistLibrary = await ensurePlaylistLibraryQueryData()

			if (playlistLibrary)
				queryClient.setQueryData<InfiniteData<BaseItemDto[]>>(
					UserPlaylistsQueryKey(playlistLibrary, user),
					(oldData) => {
						if (!oldData) return oldData

						return {
							...oldData,
							pages: oldData.pages.map((page) =>
								page.filter((item) => item.Id !== playlist.Id),
							),
						}
					},
				)
		},
		onError: () => {
			Presets.glitch()
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
		onSuccess: (_, { playlist, tracks }) => {
			Presets.castanets()

			// Refresh playlist component data
			queryClient.setQueryData<InfiniteData<BaseItemDto[]>>(
				PlaylistTracksQueryKey(playlist),
				(prev) => {
					if (!prev) return prev

					return {
						...prev,
						pages: prev.pages.map((page: BaseItemDto[]) =>
							page.filter((track) => tracks.some((t) => t.Id === track.Id)),
						),
					}
				},
			)
		},
		onError: onError,
		onSettled: onSettled,
	})
}
