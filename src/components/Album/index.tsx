import { HomeAlbumProps, StackParamList } from '../types'
import { YStack, XStack, Separator, getToken, Spacer, Button, ScrollView } from 'tamagui'
import { H5, Text } from '../Global/helpers/text'
import { ActivityIndicator, FlatList, SectionList } from 'react-native'
import { RunTimeTicks } from '../Global/helpers/time-codes'
import Track from '../Global/components/track'
import FavoriteButton from '../Global/components/favorite-button'
import { useQuery, useMutation } from '@tanstack/react-query'
import { QueryKeys } from '../../enums/query-keys'
import { ItemCard } from '../Global/components/item-card'
import { fetchAlbumDiscs } from '../../api/queries/item'
import { fetchUserPlaylists } from '../../api/queries/playlists'
import { addToPlaylist } from '../../api/mutations/playlists'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import InstantMixButton from '../Global/components/instant-mix-button'
import ItemImage from '../Global/components/image'
import React, { useState } from 'react'
import { useJellifyContext } from '../../providers'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import Icon from '../Global/components/icon'
import { mapDtoToTrack } from '../../helpers/mappings'
import { useNetworkContext } from '../../providers/Network'
import { useSettingsContext } from '../../providers/Settings'
import Toast from 'react-native-toast-message'
import { trigger } from 'react-native-haptic-feedback'
import { queryClient } from '../../constants/query-client'
import MultiSelectAddToPlaylistModal from '../Global/components/MultiSelectAddToPlaylistModal'

/**
 * The screen for an Album's track list
 *
 * @param route The route object from the parent screen,
 * containing the {@link BaseItemDto} of the album to display in the params
 *
 * @param navigation The navigation object from the parent screen
 *
 * @returns A React component
 */
export function AlbumScreen({ route, navigation }: HomeAlbumProps): React.JSX.Element {
	const { album } = route.params

	const { api, sessionId, user, library } = useJellifyContext()
	const {
		useDownloadMultiple,
		pendingDownloads,
		downloadingDownloads,
		downloadedTracks,
		failedDownloads,
	} = useNetworkContext()
	const { downloadQuality } = useSettingsContext()

	// Multi-select state
	const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
	const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set())
	const [isPlaylistModalVisible, setIsPlaylistModalVisible] = useState(false)

	const { data: discs, isPending } = useQuery({
		queryKey: [QueryKeys.ItemTracks, album.Id!],
		queryFn: () => fetchAlbumDiscs(api, album),
	})

	// Fetch user playlists for multi-select operations
	const { data: playlists } = useQuery({
		queryKey: [QueryKeys.UserPlaylists],
		queryFn: () => fetchUserPlaylists(api, user, library),
		enabled: isMultiSelectMode,
	})

	// Mutation for adding multiple tracks to playlist
	const useAddToPlaylist = useMutation({
		mutationFn: async ({
			tracks,
			playlist,
		}: {
			tracks: BaseItemDto[]
			playlist: BaseItemDto
		}) => {
			// Add tracks one by one (the API might not support batch operations)
			for (const track of tracks) {
				await addToPlaylist(api, user, track, playlist)
			}
			return { tracks, playlist }
		},
		onSuccess: (data) => {
			Toast.show({
				text1: `Added ${data.tracks.length} tracks to playlist`,
				type: 'success',
			})
			trigger('notificationSuccess')

			// Clear selection and exit multi-select mode
			setSelectedTracks(new Set())
			setIsMultiSelectMode(false)

			// Invalidate queries
			queryClient.invalidateQueries({
				queryKey: [QueryKeys.UserPlaylists],
			})
			queryClient.invalidateQueries({
				queryKey: [QueryKeys.ItemTracks, data.playlist.Id!],
			})
			setIsPlaylistModalVisible(false)
		},
		onError: () => {
			Toast.show({
				text1: 'Unable to add tracks to playlist',
				type: 'error',
			})
			trigger('notificationError')
		},
	})

	const handleStartMultiSelect = (track: BaseItemDto) => {
		console.log('Album handleStartMultiSelect called for track:', track.Name)
		trigger('impactMedium')
		setIsMultiSelectMode(true)
		setSelectedTracks(new Set([track.Id!]))
	}

	const handleSelectTrack = (track: BaseItemDto) => {
		setSelectedTracks((prev) => {
			const newSet = new Set(prev)
			if (newSet.has(track.Id!)) {
				newSet.delete(track.Id!)
			} else {
				newSet.add(track.Id!)
			}
			return newSet
		})
	}

	const handleExitMultiSelect = () => {
		setIsMultiSelectMode(false)
		setSelectedTracks(new Set())
	}

	const handleAddSelectedToPlaylist = (playlist: BaseItemDto) => {
		const allTracks = discs?.flatMap((disc) => disc.data) || []
		const tracksToAdd = allTracks.filter((track) => selectedTracks.has(track.Id!))

		if (tracksToAdd.length > 0) {
			useAddToPlaylist.mutate({ tracks: tracksToAdd, playlist })
		}
	}

	const handleOpenPlaylistModal = () => {
		if (selectedTracks.size > 0) {
			setIsPlaylistModalVisible(true)
		}
	}

	const handleSelectAll = () => {
		const allTracks = discs?.flatMap((disc) => disc.data) || []
		const allTrackIds = allTracks.map((track) => track.Id!).filter(Boolean)

		if (selectedTracks.size === allTrackIds.length) {
			// Deselect all if all are selected
			setSelectedTracks(new Set())
			trigger('impactLight')
		} else {
			// Select all tracks
			setSelectedTracks(new Set(allTrackIds))
			trigger('impactMedium')
		}
	}

	const getTotalTracksCount = () => {
		return discs?.flatMap((disc) => disc.data).length || 0
	}

	const downloadAlbum = (item: BaseItemDto[]) => {
		if (!api || !sessionId) return
		const jellifyTracks = item.map((item) =>
			mapDtoToTrack(api, sessionId, item, [], undefined, downloadQuality),
		)
		useDownloadMultiple.mutate(jellifyTracks)
	}
	return (
		<>
			{isMultiSelectMode && (
				<YStack
					backgroundColor={'$background'}
					borderBottomWidth={1}
					borderBottomColor={'$borderColor'}
					paddingBottom={'$2'}
				>
					<XStack padding={'$3'} alignItems='center' justifyContent='space-between'>
						<XStack alignItems='center' gap={'$3'}>
							<Button variant='outlined' size={'$3'} onPress={handleExitMultiSelect}>
								Cancel
							</Button>
							<Text
								bold
							>{`${selectedTracks.size} of ${getTotalTracksCount()} selected`}</Text>
						</XStack>

						<Button variant='outlined' size={'$3'} onPress={handleSelectAll}>
							{selectedTracks.size === getTotalTracksCount()
								? 'Deselect All'
								: 'Select All'}
						</Button>
					</XStack>

					{selectedTracks.size > 0 && (
						<XStack paddingHorizontal={'$3'} paddingTop={'$2'} justifyContent='center'>
							<Button
								flex={1}
								onPress={handleOpenPlaylistModal}
								disabled={!playlists || playlists.length === 0}
							>
								Add to Playlist...
							</Button>
						</XStack>
					)}
				</YStack>
			)}

			<SectionList
				contentInsetAdjustmentBehavior='automatic'
				sections={discs ? discs : [{ title: '1', data: [] }]}
				keyExtractor={(item, index) => item.Id! + index}
				ItemSeparatorComponent={() => <Separator />}
				renderSectionHeader={({ section }) => {
					return (
						<XStack
							width='100%'
							justifyContent={
								discs && discs.length >= 2 ? 'space-between' : 'flex-end'
							}
							alignItems='center'
							backgroundColor={'$background'}
							paddingHorizontal={'$4.5'}
						>
							{discs && discs.length >= 2 && (
								<Text
									paddingVertical={'$2'}
									paddingLeft={'$4.5'}
									bold
								>{`Disc ${section.title}`}</Text>
							)}
							{!isMultiSelectMode && (
								<Icon
									name={
										pendingDownloads?.length ? 'progress-download' : 'download'
									}
									small
									onPress={() => {
										if (pendingDownloads.length) {
											return
										}
										downloadAlbum(section.data)
									}}
								/>
							)}
						</XStack>
					)
				}}
				ListHeaderComponent={() => AlbumTrackListHeader(album, navigation)}
				renderItem={({ item: track, index }) => (
					<Track
						track={track}
						tracklist={discs?.flatMap((disc) => disc.data)}
						index={discs?.flatMap((disc) => disc.data).indexOf(track) ?? index}
						navigation={navigation}
						queue={album}
						isMultiSelectMode={isMultiSelectMode}
						isSelected={selectedTracks.has(track.Id!)}
						onSelect={handleSelectTrack}
						onStartMultiSelect={handleStartMultiSelect}
					/>
				)}
				ListFooterComponent={() => AlbumTrackListFooter(album, navigation)}
				ListEmptyComponent={() => (
					<YStack>
						{isPending ? (
							<ActivityIndicator size='large' color={'$background'} />
						) : (
							<Text>No tracks found</Text>
						)}
					</YStack>
				)}
			/>
			{isMultiSelectMode && playlists && (
				<MultiSelectAddToPlaylistModal
					isVisible={isPlaylistModalVisible}
					onClose={() => setIsPlaylistModalVisible(false)}
					playlists={playlists}
					onSelectPlaylist={handleAddSelectedToPlaylist}
					isLoading={useAddToPlaylist.isPending}
				/>
			)}
		</>
	)
}

/**
 * Renders a header for an Album's track list
 * @param album The {@link BaseItemDto} of the album to render the header for
 * @param navigation The navigation object from the parent {@link AlbumScreen}
 * @returns A React component
 */
function AlbumTrackListHeader(
	album: BaseItemDto,
	navigation: NativeStackNavigationProp<StackParamList>,
): React.JSX.Element {
	const { width } = useSafeAreaFrame()

	return (
		<YStack marginTop={'$4'} alignItems='center'>
			<XStack justifyContent='center'>
				<ItemImage item={album} width={'$20'} height={'$20'} />

				<Spacer />

				<YStack alignContent='center' justifyContent='center'>
					<H5
						lineBreakStrategyIOS='standard'
						textAlign='center'
						numberOfLines={5}
						minWidth={width / 2.25}
						maxWidth={width / 2.25}
					>
						{album.Name ?? 'Untitled Album'}
					</H5>

					<XStack justify='center' marginVertical={'$2'}>
						<YStack flex={1}>
							{album.ProductionYear ? (
								<Text display='block' textAlign='right'>
									{album.ProductionYear?.toString() ?? 'Unknown Year'}
								</Text>
							) : null}
						</YStack>

						<Separator vertical marginHorizontal={'$3'} />

						<YStack flex={1}>
							<RunTimeTicks>{album.RunTimeTicks}</RunTimeTicks>
						</YStack>
					</XStack>

					<XStack justifyContent='center' marginVertical={'$2'}>
						<FavoriteButton item={album} />

						<Spacer />

						<InstantMixButton item={album} navigation={navigation} />
					</XStack>
				</YStack>
			</XStack>

			<FlatList
				contentContainerStyle={{
					marginTop: getToken('$4'),
				}}
				style={{
					alignSelf: 'center',
				}}
				horizontal
				keyExtractor={(item) => item.Id!}
				data={album.AlbumArtists}
				renderItem={({ item: artist }) => (
					<ItemCard
						size={'$10'}
						item={artist}
						caption={artist.Name ?? 'Unknown Artist'}
						onPress={() => {
							navigation.navigate('Artist', {
								artist,
							})
						}}
					/>
				)}
			/>
		</YStack>
	)
}

function AlbumTrackListFooter(
	album: BaseItemDto,
	navigation: NativeStackNavigationProp<StackParamList>,
): React.JSX.Element {
	return (
		<YStack marginLeft={'$2'}>
			{album.ArtistItems && album.ArtistItems.length > 1 && (
				<>
					<H5>Featuring</H5>

					<FlatList
						data={album.ArtistItems}
						horizontal
						renderItem={({ item: artist }) => (
							<ItemCard
								size={'$8'}
								item={artist}
								caption={artist.Name ?? 'Unknown Artist'}
								onPress={() => {
									navigation.navigate('Artist', {
										artist,
									})
								}}
							/>
						)}
					/>
				</>
			)}
		</YStack>
	)
}
