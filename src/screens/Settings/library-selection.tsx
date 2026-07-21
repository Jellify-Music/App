import React, { useCallback } from 'react'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { SettingsStackParamList } from './types'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { QueryKeys } from '../../enums/query-keys'
import { queryClient } from '../../constants/query-client'
import LibrarySelector from '../../components/Global/components/library-selector'
import { useJellifyLibrary } from '../../stores/auth'
import { useNavigation } from '@react-navigation/native'
import { useSuccessToast } from '../../hooks/toasts'

export default function LibrarySelectionScreen(): React.JSX.Element {
	const [library, setLibrary] = useJellifyLibrary()

	const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>()

	const toast = useSuccessToast()

	const handleLibrarySelected = (libraryId: string, selectedLibrary: BaseItemDto) => {
		// Don't proceed if the same library is selected
		if (libraryId === library?.musicLibraryId) {
			navigation.goBack()
			return
		}

		setLibrary({
			musicLibraryId: libraryId,
			musicLibraryName: selectedLibrary.Name ?? 'No library name',
			musicLibraryPrimaryImageId: selectedLibrary.ImageTags?.Primary,
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

		toast({
			title: 'Library changed',
			message: `Now using ${selectedLibrary.Name}`,
		})

		navigation.goBack()
	}

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
