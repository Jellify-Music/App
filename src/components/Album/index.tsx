import { YStack, XStack, Separator, getToken, Spacer, Spinner } from 'tamagui'
import { H5, Text } from '../Global/helpers/text'
import { FlatList, SectionList } from 'react-native'
import { RunTimeTicks } from '../Global/helpers/time-codes'
import Track from '../Global/components/track'
import FavoriteButton from '../Global/components/favorite-button'
import { ItemCard } from '../Global/components/item-card'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import InstantMixButton from '../Global/components/instant-mix-button'
import ItemImage from '../Global/components/image'
import React, { useCallback, useMemo } from 'react'
import { useJellifyContext } from '../../providers'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import Icon from '../Global/components/icon'
import { mapDtoToTrack } from '../../utils/mappings'
import { useNetworkContext } from '../../providers/Network'
import { useNetworkStatus } from '../../stores/network'
import { useLoadNewQueue } from '../../providers/Player/hooks/mutations'
import { QueuingType } from '../../enums/queuing-type'
import { useAlbumContext } from '../../providers/Album'
import { useNavigation } from '@react-navigation/native'
import HomeStackParamList from '../../screens/Home/types'
import LibraryStackParamList from '../../screens/Library/types'
import DiscoverStackParamList from '../../screens/Discover/types'
import { BaseStackParamList } from '../../screens/types'
import useStreamingDeviceProfile, { useDownloadingDeviceProfile } from '../../stores/device-profile'

/**
 * The screen for an Album's track list
 *
 *
 * @param navigation The navigation object from the parent screen
 *
 * @returns A React component
 */
export function Album(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<BaseStackParamList>>()

	const { album, discs, isPending } = useAlbumContext()

	const { api } = useJellifyContext()
	const { useDownloadMultiple, pendingDownloads } = useNetworkContext()
	const [networkStatus] = useNetworkStatus()
	const streamingDeviceProfile = useStreamingDeviceProfile()
	const downloadingDeviceProfile = useDownloadingDeviceProfile()
	const { mutate: loadNewQueue } = useLoadNewQueue()

	const downloadAlbum = (item: BaseItemDto[]) => {
		if (!api) return
		const jellifyTracks = item.map((item) =>
			mapDtoToTrack(api, item, [], downloadingDeviceProfile),
		)
		useDownloadMultiple(jellifyTracks)
	}

	const playAlbum = useCallback(
		(shuffled: boolean = false) => {
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
		},
		[discs, loadNewQueue],
	)

	const sections = useMemo(
		() =>
			(Array.isArray(discs) ? discs : []).map(({ title, data }) => ({
				title,
				data: Array.isArray(data) ? data : [],
			})),
		[discs],
	)

	const hasMultipleSections = sections.length > 1

	const albumTrackList = useMemo(() => discs?.flatMap((disc) => disc.data), [discs])

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
						paddingHorizontal={'$4.5'}
					>
						<Text
							paddingVertical={'$2'}
							paddingLeft={'$4.5'}
							bold
						>{`Disc ${section.title}`}</Text>
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
			ListHeaderComponent={() => AlbumTrackListHeader(album, playAlbum, navigation)}
			renderItem={({ item: track, index }) => (
				<Track
					navigation={navigation}
					track={track}
					tracklist={albumTrackList}
					index={albumTrackList?.indexOf(track) ?? index}
					queue={album}
				/>
			)}
			ListFooterComponent={() => AlbumTrackListFooter(album)}
			ListEmptyComponent={() => (
				<YStack>
					{isPending ? (
						<Spinner size='large' color={'$background'} />
					) : (
						<Text>No tracks found</Text>
					)}
				</YStack>
			)}
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
function AlbumTrackListHeader(
	album: BaseItemDto,
	playAlbum: (shuffled?: boolean) => void,
	navigation: Pick<NativeStackNavigationProp<BaseStackParamList>, 'navigate' | 'dispatch'>,
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
						maxWidth={width / 2.15}
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

					<XStack
						justifyContent='center'
						marginVertical={'$2'}
						gap={'$4'}
						flexWrap='wrap'
					>
						<FavoriteButton item={album} />

						<InstantMixButton item={album} navigation={navigation} />

						<Icon name='play' onPress={() => playAlbum(false)} small />

						<Icon name='shuffle' onPress={() => playAlbum(true)} small />
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

function AlbumTrackListFooter(album: BaseItemDto): React.JSX.Element {
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
