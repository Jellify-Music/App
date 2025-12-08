import React, { useCallback } from 'react'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { SettingsStackParamList } from './types'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { QueryKeys } from '../../enums/query-keys'
import { queryClient } from '../../constants/query-client'
import Toast from 'react-native-toast-message'
import LibrarySelector from '../../components/Global/components/library-selector'
import { useJellifyLibrary } from '../../stores'

export default function LibrarySelectionScreen({
	navigation,
}: {
	navigation: NativeStackNavigationProp<SettingsStackParamList, 'LibrarySelection'>
}): React.JSX.Element {
	const [library, setLibrary] = useJellifyLibrary()

	const handleLibrarySelected = useCallback(
		(libraryId: string, selectedLibrary: BaseItemDto, playlistLibrary?: BaseItemDto) => {
			// Don't proceed if the same library is selected
			if (libraryId === library?.musicLibraryId) {
				navigation.goBack()
				return
			}

			setLibrary({
				musicLibraryId: libraryId,
				musicLibraryName: selectedLibrary.Name ?? 'No library name',
				musicLibraryPrimaryImageId: selectedLibrary.ImageTags?.Primary,
				playlistLibraryId: playlistLibrary?.Id,
				playlistLibraryPrimaryImageId: playlistLibrary?.ImageTags?.Primary,
			})

			// Invalidate all library-related queries to refresh the data
			queryClient.invalidateQueries({ queryKey: [QueryKeys.AllArtistsAlphabetical] })
			queryClient.invalidateQueries({ queryKey: [QueryKeys.AllAlbumsAlphabetical] })
			queryClient.invalidateQueries({ queryKey: [QueryKeys.AllTracks] })
			queryClient.invalidateQueries({ queryKey: [QueryKeys.AllAlbums] })
			queryClient.invalidateQueries({ queryKey: [QueryKeys.AllArtists] })
			queryClient.invalidateQueries({ queryKey: [QueryKeys.Playlists] })
			queryClient.invalidateQueries({ queryKey: [QueryKeys.FavoritePlaylists] })
			queryClient.invalidateQueries({ queryKey: [QueryKeys.FavoriteArtists] })
			queryClient.invalidateQueries({ queryKey: [QueryKeys.FavoriteAlbums] })
			queryClient.invalidateQueries({ queryKey: [QueryKeys.FavoriteTracks] })
			queryClient.invalidateQueries({ queryKey: [QueryKeys.RecentlyPlayed] })
			queryClient.invalidateQueries({ queryKey: [QueryKeys.RecentlyPlayedArtists] })
			queryClient.invalidateQueries({ queryKey: [QueryKeys.FrequentArtists] })
			queryClient.invalidateQueries({ queryKey: [QueryKeys.FrequentlyPlayed] })
			queryClient.invalidateQueries({ queryKey: [QueryKeys.RecentlyAdded] })
			queryClient.invalidateQueries({ queryKey: [QueryKeys.RefreshHome] })

			Toast.show({
				text1: 'Library changed',
				text2: `Now using ${selectedLibrary.Name}`,
				type: 'success',
			})

			navigation.goBack()
		},
		[setLibrary],
	)

	const handleCancel = () => {
		navigation.goBack()
	}

	return (
		<LibrarySelector
			onLibrarySelected={handleLibrarySelected}
			onCancel={handleCancel}
			primaryButtonText='Apply Changes'
			primaryButtonIcon='check'
			cancelButtonText='Cancel'
			cancelButtonIcon='chevron-left'
		/>
	)
}
