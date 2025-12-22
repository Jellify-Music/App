import { YStack, XStack, Separator, Spinner } from 'tamagui'
import { Text } from '../Global/helpers/text'
import { SectionList } from 'react-native'
import Track from '../Global/components/track'
import FavoriteButton from '../Global/components/favorite-button'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import React, { useLayoutEffect } from 'react'
import Icon from '../Global/components/icon'
import { useNavigation } from '@react-navigation/native'
import { BaseStackParamList } from '../../screens/types'
import { closeAllSwipeableRows } from '../Global/components/swipeable-row-registry'
import { useApi } from '../../stores'
import { QueryKeys } from '../../enums/query-keys'
import { fetchAlbumDiscs } from '../../api/queries/item'
import { useQuery } from '@tanstack/react-query'
import useAddToPendingDownloads, { useIsDownloading } from '../../stores/network/downloads'
import { useIsDownloaded } from '../../api/queries/download'
import AlbumTrackListFooter from './footer'
import AlbumTrackListHeader from './header'
import Animated, { FadeInUp, FadeOutDown, LinearTransition } from 'react-native-reanimated'
import { useStorageContext } from '../../providers/Storage'

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

	const api = useApi()

	const { data: discs, isPending } = useQuery({
		queryKey: [QueryKeys.ItemTracks, album.Id],
		queryFn: () => fetchAlbumDiscs(api, album),
	})

	const isDownloaded = useIsDownloaded(
		discs?.flatMap(({ data }) => data).map(({ Id }) => Id) ?? [],
	)

	const addToDownloadQueue = useAddToPendingDownloads()

	const sections = (Array.isArray(discs) ? discs : []).map(({ title, data }) => ({
		title,
		data: Array.isArray(data) ? data : [],
	}))

	const hasMultipleSections = sections.length > 1

	const albumTrackList = discs?.flatMap((disc) => disc.data)

	const albumDownloadPending = useIsDownloading(albumTrackList ?? [])

	const { deleteDownloads } = useStorageContext()

	const handleDeleteDownload = () => deleteDownloads(albumTrackList?.map(({ Id }) => Id!) ?? [])

	const handleDownload = () => addToDownloadQueue(albumTrackList ?? [])

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<XStack gap={'$2'} justifyContent='center' alignContent='center'>
					{albumTrackList &&
						(isDownloaded ? (
							<Animated.View
								entering={FadeInUp.springify()}
								exiting={FadeOutDown.springify()}
								layout={LinearTransition.springify()}
							>
								<Icon
									color='$warning'
									name='broom'
									onPress={handleDeleteDownload}
								/>
							</Animated.View>
						) : albumDownloadPending ? (
							<Spinner justifyContent='center' color={'$neutral'} />
						) : (
							<Animated.View
								entering={FadeInUp.springify()}
								exiting={FadeOutDown.springify()}
								layout={LinearTransition.springify()}
							>
								<Icon
									color='$success'
									name='download-circle-outline'
									onPress={handleDownload}
								/>
							</Animated.View>
						))}
					<FavoriteButton item={album} />
				</XStack>
			),
		})
	}, [
		album,
		navigation,
		isDownloaded,
		handleDeleteDownload,
		handleDownload,
		albumDownloadPending,
	])

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
