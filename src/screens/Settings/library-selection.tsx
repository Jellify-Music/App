import React from 'react'
import { SettingsStackNavigator } from './types'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { QueryKeys } from '../../enums/query-keys'
import { queryClient } from '../../api/client'
import Toast from 'react-native-toast-message'
import LibrarySelector from '../../components/LibrarySelector'
import { useJellifyLibrary } from '../../stores/auth'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'

export default function LibrarySelectionScreen(): React.JSX.Element {
	const { t } = useTranslation()

	const [library, setLibrary] = useJellifyLibrary()

	const navigation = useNavigation<SettingsStackNavigator>()

	const handleLibrarySelected = (selectedLibrary: BaseItemDto | undefined) => {
		// Don't proceed if the same library is selected
		if (selectedLibrary?.Id === library?.musicLibraryId) {
			navigation.goBack()
			return
		}

		// Without a selected library, Jellify uses every music library
		setLibrary(
			selectedLibrary
				? {
						musicLibraryId: selectedLibrary.Id!,
						musicLibraryName: selectedLibrary.Name ?? 'No library name',
						musicLibraryPrimaryImageId: selectedLibrary.ImageTags?.Primary,
					}
				: undefined,
		)

		// Invalidate all library-related queries to refresh the data
		queryClient.invalidateQueries({ queryKey: [QueryKeys.InfiniteArtists] })
		queryClient.invalidateQueries({ queryKey: [QueryKeys.InfiniteAlbums] })
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
			text1: t('settings.library.changed'),
			text2: selectedLibrary
				? t('settings.library.nowUsing', { name: selectedLibrary.Name })
				: t('settings.library.nowUsingAll'),
			type: 'success',
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
			primaryButtonText={t('settings.library.apply')}
			primaryButtonIcon='check'
			cancelButtonText={t('common.cancel')}
			cancelButtonIcon='chevron-left'
		/>
	)
}
