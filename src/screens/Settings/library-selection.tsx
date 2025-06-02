import React, { useEffect, useState } from 'react'
import { getToken, Spinner, ToggleGroup, YStack } from 'tamagui'
import { H2, Text } from '../../components/Global/helpers/text'
import Button from '../../components/Global/helpers/button'
import _ from 'lodash'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useJellifyContext } from '../../providers'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { QueryKeys } from '../../enums/query-keys'
import { fetchUserViews } from '../../api/queries/libraries'
import { useQuery } from '@tanstack/react-query'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { SettingsStackParamList } from './types'
import Icon from '../../components/Global/components/icon'
import Toast from 'react-native-toast-message'
import { queryClient } from '../../constants/query-client'

export default function LibrarySelectionScreen({
	navigation,
}: {
	navigation: NativeStackNavigationProp<SettingsStackParamList, 'LibrarySelection'>
}): React.JSX.Element {
	const { api, user, library, setLibrary } = useJellifyContext()

	const [selectedLibraryId, setSelectedLibraryId] = useState<string | undefined>(
		library?.musicLibraryId,
	)
	const [playlistLibrary, setPlaylistLibrary] = useState<BaseItemDto | undefined>(undefined)

	const {
		data: libraries,
		isError,
		isPending,
		isSuccess,
	} = useQuery({
		queryKey: [QueryKeys.UserViews],
		queryFn: () => fetchUserViews(api, user),
	})

	useEffect(() => {
		if (!isPending && isSuccess && libraries) {
			// Find the playlist library
			const foundPlaylistLibrary = libraries.find((lib) => lib.CollectionType === 'playlists')
			setPlaylistLibrary(foundPlaylistLibrary)
		}
	}, [isPending, isSuccess, libraries])

	const handleLibraryChange = () => {
		if (!selectedLibraryId || !libraries) return

		const selectedLibrary = libraries.find((lib) => lib.Id === selectedLibraryId)

		if (selectedLibrary) {
			setLibrary({
				musicLibraryId: selectedLibraryId,
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
			queryClient.invalidateQueries({ queryKey: [QueryKeys.UserPlaylists] })
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
		}
	}

	const musicLibraries = libraries?.filter((library) => library.CollectionType === 'music') ?? []
	const hasMultipleLibraries = musicLibraries.length > 1

	return (
		<SafeAreaView style={{ flex: 1 }}>
			<YStack flex={1} justifyContent='center' paddingHorizontal={'$4'}>
				<YStack alignItems='center' marginBottom={'$6'}>
					<H2 textAlign='center' marginBottom={'$2'}>
						Select Music Library
					</H2>
					{!hasMultipleLibraries && (
						<Text color='$borderColor' textAlign='center'>
							Only one music library is available
						</Text>
					)}
				</YStack>

				<YStack gap={'$4'}>
					{isPending ? (
						<Spinner size='large' />
					) : isError ? (
						<Text color='$danger' textAlign='center'>
							Unable to load libraries
						</Text>
					) : (
						<ToggleGroup
							orientation='vertical'
							type='single'
							disableDeactivation={true}
							value={selectedLibraryId}
							onValueChange={setSelectedLibraryId}
							disabled={!hasMultipleLibraries}
						>
							{musicLibraries.map((library) => (
								<ToggleGroup.Item
									key={library.Id}
									value={library.Id!}
									aria-label={library.Name!}
									backgroundColor={
										selectedLibraryId === library.Id
											? getToken('$color.purpleGray')
											: 'unset'
									}
									opacity={!hasMultipleLibraries ? 0.6 : 1}
								>
									<Text>{library.Name ?? 'Unnamed Library'}</Text>
								</ToggleGroup.Item>
							))}
						</ToggleGroup>
					)}

					<YStack gap={'$3'} marginTop={'$4'}>
						<Button
							disabled={
								!selectedLibraryId || selectedLibraryId === library?.musicLibraryId
							}
							icon={() => <Icon name='check' small />}
							onPress={handleLibraryChange}
						>
							Apply Changes
						</Button>

						<Button
							variant='outlined'
							icon={() => <Icon name='chevron-left' small />}
							onPress={() => navigation.goBack()}
						>
							Cancel
						</Button>
					</YStack>
				</YStack>
			</YStack>
		</SafeAreaView>
	)
}
