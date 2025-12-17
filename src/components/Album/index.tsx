import { YStack, XStack, Separator, Spinner } from 'tamagui'
import { H5, Text } from '../Global/helpers/text'
import { SectionList } from 'react-native'
import { RunTimeTicks } from '../Global/helpers/time-codes'
import Track from '../Global/components/track'
import FavoriteButton from '../Global/components/favorite-button'
import { ItemCard } from '../Global/components/item-card'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import InstantMixButton from '../Global/components/instant-mix-button'
import ItemImage from '../Global/components/image'
import React, { useLayoutEffect } from 'react'
import Icon from '../Global/components/icon'
import { useNetworkStatus } from '../../stores/network'
import { useLoadNewQueue } from '../../providers/Player/hooks/mutations'
import { QueuingType } from '../../enums/queuing-type'
import { useNavigation } from '@react-navigation/native'
import HomeStackParamList from '../../screens/Home/types'
import LibraryStackParamList from '../../screens/Library/types'
import DiscoverStackParamList from '../../screens/Discover/types'
import { BaseStackParamList } from '../../screens/types'
import useStreamingDeviceProfile from '../../stores/device-profile'
import { closeAllSwipeableRows } from '../Global/components/swipeable-row-registry'
import { useApi } from '../../stores'
import { QueryKeys } from '../../enums/query-keys'
import { fetchAlbumDiscs } from '../../api/queries/item'
import { useQuery } from '@tanstack/react-query'
import useAddToPendingDownloads, { usePendingDownloads } from '../../stores/network/downloads'
import Button from '../Global/helpers/button'
import Animated, { FadeInUp, FadeOutDown, LinearTransition } from 'react-native-reanimated'
import { FlashList } from '@shopify/flash-list'

/**
 * The screen for an Album's track list
 *
 *
 * @param navigation The navigation object from the parent screen
 *
 * @returns A React component
 */
export function Album({ album }: { album: BaseItemDto }): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<BaseStackParamList>>()

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<XStack gap={'$2'} justifyContent='center' alignContent='center'>
					<FavoriteButton item={album} />

					<InstantMixButton item={album} navigation={navigation} />
				</XStack>
			),
		})
	})

	const api = useApi()

	const { data: discs, isPending } = useQuery({
		queryKey: [QueryKeys.ItemTracks, album.Id],
		queryFn: () => fetchAlbumDiscs(api, album),
	})

	const addToDownloadQueue = useAddToPendingDownloads()

	const pendingDownloads = usePendingDownloads()

	const downloadAlbum = (item: BaseItemDto[]) => addToDownloadQueue(item)

	const sections = (Array.isArray(discs) ? discs : []).map(({ title, data }) => ({
		title,
		data: Array.isArray(data) ? data : [],
	}))

	const hasMultipleSections = sections.length > 1

	const albumTrackList = discs?.flatMap((disc) => disc.data)

	return (
		<SectionList
			contentInsetAdjustmentBehavior='automatic'
			sections={sections}
			keyExtractor={(item, index) => item.Id! + index}
			ItemSeparatorComponent={Separator}
			renderSectionHeader={({ section }) => {
				return !isPending && hasMultipleSections ? (
					<XStack
						width='100%'
						justifyContent={hasMultipleSections ? 'space-between' : 'flex-end'}
						alignItems='center'
						backgroundColor={'$background'}
						paddingHorizontal={'$2'}
					>
						<Text padding={'$2'} bold>{`Disc ${section.title}`}</Text>
						<Icon
							name={pendingDownloads.length ? 'progress-download' : 'download'}
							small
							onPress={() => {
								if (pendingDownloads.length) {
									return
								}
								downloadAlbum(section.data)
							}}
						/>
					</XStack>
				) : null
			}}
			ListHeaderComponent={() => <AlbumTrackListHeader album={album} />}
			renderItem={({ item: track, index }) => (
				<Track
					navigation={navigation}
					track={track}
					tracklist={albumTrackList}
					index={albumTrackList?.indexOf(track) ?? index}
					queue={album}
				/>
			)}
			ListFooterComponent={() => <AlbumTrackListFooter album={album} />}
			ListEmptyComponent={() => (
				<YStack flex={1} alignContent='center' margin={'$4'}>
					{isPending ? (
						<Spinner color={'$primary'} />
					) : (
						<Text color={'$borderColor'}>No album tracks</Text>
					)}
				</YStack>
			)}
			onScrollBeginDrag={closeAllSwipeableRows}
		/>
	)
}

/**
 * Renders a header for an Album's track list
 * @param album The {@link BaseItemDto} of the album to render the header for
 * @param navigation The navigation object from the parent {@link Album}
 * @param playAlbum The function to call to play the album
 * @returns A React component
 */
function AlbumTrackListHeader({ album }: { album: BaseItemDto }): React.JSX.Element {
	const api = useApi()

	const [networkStatus] = useNetworkStatus()
	const streamingDeviceProfile = useStreamingDeviceProfile()

	const loadNewQueue = useLoadNewQueue()

	const { data: discs, isPending } = useQuery({
		queryKey: [QueryKeys.ItemTracks, album.Id],
		queryFn: () => fetchAlbumDiscs(api, album),
	})

	const navigation = useNavigation<NativeStackNavigationProp<BaseStackParamList>>()

	const playAlbum = (shuffled: boolean = false) => {
		if (!discs || discs.length === 0) return

		const allTracks = discs.flatMap((disc) => disc.data) ?? []
		if (allTracks.length === 0) return

		loadNewQueue({
			api,
			networkStatus,
			deviceProfile: streamingDeviceProfile,
			track: allTracks[0],
			index: 0,
			tracklist: allTracks,
			queue: album,
			queuingType: QueuingType.FromSelection,
			shuffled,
			startPlayback: true,
		})
	}

	return (
		<YStack alignContent='center' flex={1} marginTop={'$4'}>
			<ItemImage
				item={album}
				width={'$20'}
				height={'$20'}
				imageOptions={{
					maxHeight: 500,
					maxWidth: 500,
				}}
			/>

			<YStack marginTop={'$2'} alignContent='center' justifyContent='center' gap={'$2'}>
				<H5 lineBreakStrategyIOS='standard' textAlign='center' numberOfLines={5}>
					{album.Name ?? 'Untitled Album'}
				</H5>

				{album.AlbumArtists && (
					<Text
						bold
						color={'$primary'}
						onPress={() =>
							navigation.navigate('Artist', {
								artist: album.AlbumArtists![0],
							})
						}
						textAlign='center'
						fontSize={'$5'}
						paddingBottom={'$2'}
					>
						{album.AlbumArtists![0].Name ?? 'Untitled Artist'}
					</Text>
				)}

				<XStack justify='center' gap={'$3'} marginBottom={'$2'}>
					<YStack flex={1}>
						{album.ProductionYear ? (
							<Text fontVariant={['tabular-nums']} textAlign='right'>
								{album.ProductionYear?.toString() ?? 'Unknown Year'}
							</Text>
						) : null}
					</YStack>

					<Separator vertical />

					<RunTimeTicks props={{ flex: 1, textAlign: 'left' }}>
						{album.RunTimeTicks}
					</RunTimeTicks>
				</XStack>

				{discs && (
					<Animated.View
						entering={FadeInUp.springify()}
						exiting={FadeOutDown.springify()}
						layout={LinearTransition.springify()}
					>
						<XStack alignContent='center' gap={'$2'} marginHorizontal={'$2'}>
							<Button
								icon={() => <Icon small name='play' color='$primary' />}
								borderWidth={'$1'}
								borderColor={'$primary'}
								flex={1}
								onPress={() => playAlbum(false)}
								pressStyle={{ scale: 0.875 }}
								hoverStyle={{ scale: 0.925 }}
								animation={'bouncy'}
							>
								<Text bold color={'$primary'}>
									Play
								</Text>
							</Button>

							<Button
								icon={() => <Icon small name='shuffle' color='$primary' />}
								borderWidth={'$1'}
								borderColor={'$primary'}
								flex={1}
								onPress={() => playAlbum(true)}
								pressStyle={{ scale: 0.875 }}
								hoverStyle={{ scale: 0.925 }}
								animation={'bouncy'}
							>
								<Text bold color={'$primary'}>
									Shuffle
								</Text>
							</Button>
						</XStack>
					</Animated.View>
				)}
			</YStack>
		</YStack>
	)
}

function AlbumTrackListFooter({ album }: { album: BaseItemDto }): React.JSX.Element {
	const navigation =
		useNavigation<
			NativeStackNavigationProp<
				HomeStackParamList | LibraryStackParamList | DiscoverStackParamList
			>
		>()

	return (
		<YStack marginLeft={'$2'}>
			{album.ArtistItems && album.ArtistItems.length > 1 && (
				<>
					<H5>Featuring</H5>

					<FlashList
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
