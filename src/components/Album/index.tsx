import { HomeAlbumProps, StackParamList } from '../types'
import { YStack, XStack, Separator, getToken, Spacer } from 'tamagui'
import { H5, Text } from '../Global/helpers/text'
import { ActivityIndicator, FlatList, SectionList } from 'react-native'
import { RunTimeTicks } from '../Global/helpers/time-codes'
import Track from '../Global/components/track'
import FavoriteButton from '../Global/components/favorite-button'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '../../enums/query-keys'
import { ItemCard } from '../Global/components/item-card'
import { fetchAlbumDiscs } from '../../api/queries/item'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import InstantMixButton from '../Global/components/instant-mix-button'
import ItemImage from '../Global/components/image'
import React from 'react'
import { useJellifyContext } from '../../providers'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import Icon from '../Global/components/icon'
import { mapDtoToTrack } from '../../helpers/mappings'
import { useNetworkContext } from '../../providers/Network'
import { useSettingsContext } from '../../providers/Settings'
import { useQueueContext } from '../../providers/Player/queue'
import { usePlayerContext } from '../../providers/Player'
import { QueuingType } from '../../enums/queuing-type'

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

	const { api, sessionId } = useJellifyContext()
	const {
		useDownloadMultiple,
		pendingDownloads,
		downloadingDownloads,
		downloadedTracks,
		failedDownloads,
	} = useNetworkContext()
	const { downloadQuality, streamingQuality } = useSettingsContext()
	const { useLoadNewQueue } = useQueueContext()
	const { useStartPlayback } = usePlayerContext()

	const { data: discs, isPending } = useQuery({
		queryKey: [QueryKeys.ItemTracks, album.Id!],
		queryFn: () => fetchAlbumDiscs(api, album),
	})

	const downloadAlbum = (item: BaseItemDto[]) => {
		if (!api || !sessionId) return
		const jellifyTracks = item.map((item) =>
			mapDtoToTrack(api, sessionId, item, [], undefined, downloadQuality, streamingQuality),
		)
		useDownloadMultiple.mutate(jellifyTracks)
	}

	const playAlbum = (shuffled: boolean = false) => {
		if (!discs || discs.length === 0) return

		const allTracks = discs.flatMap((disc) => disc.data)
		if (allTracks.length === 0) return

		useLoadNewQueue.mutate(
			{
				track: allTracks[0],
				index: 0,
				tracklist: allTracks,
				queue: album,
				queuingType: QueuingType.FromSelection,
				shuffled,
			},
			{
				onSuccess: () => useStartPlayback.mutate(),
			},
		)
	}

	return (
		<SectionList
			contentInsetAdjustmentBehavior='automatic'
			sections={discs ? discs : [{ title: '1', data: [] }]}
			keyExtractor={(item, index) => item.Id! + index}
			ItemSeparatorComponent={() => <Separator />}
			renderSectionHeader={({ section }) => {
				return (
					<XStack
						width='100%'
						justifyContent={discs && discs.length >= 2 ? 'space-between' : 'flex-end'}
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
						<Icon
							name={pendingDownloads?.length ? 'progress-download' : 'download'}
							small
							onPress={() => {
								if (pendingDownloads.length) {
									return
								}
								downloadAlbum(section.data)
							}}
						/>
					</XStack>
				)
			}}
			ListHeaderComponent={() => AlbumTrackListHeader(album, navigation, playAlbum)}
			renderItem={({ item: track, index }) => (
				<Track
					track={track}
					tracklist={discs?.flatMap((disc) => disc.data)}
					index={discs?.flatMap((disc) => disc.data).indexOf(track) ?? index}
					navigation={navigation}
					queue={album}
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
	)
}

/**
 * Renders a header for an Album's track list
 * @param album The {@link BaseItemDto} of the album to render the header for
 * @param navigation The navigation object from the parent {@link AlbumScreen}
 * @param playAlbum The function to call to play the album
 * @returns A React component
 */
function AlbumTrackListHeader(
	album: BaseItemDto,
	navigation: NativeStackNavigationProp<StackParamList>,
	playAlbum: (shuffled?: boolean) => void,
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
