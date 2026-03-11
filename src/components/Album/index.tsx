import { YStack, XStack, Spinner, useTheme } from 'tamagui'
import { Text } from '../Global/helpers/text'
import { RefreshControl, SectionList } from 'react-native'
import Track from '../Global/components/Track'
import FavoriteButton from '../Global/components/favorite-button'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import React, { useLayoutEffect } from 'react'
import Icon from '../Global/components/icon'
import { useNavigation } from '@react-navigation/native'
import { BaseStackParamList } from '../../screens/types'
import { closeAllSwipeableRows } from '../Global/components/swipeable-row-registry'
import { getApi } from '../../stores'
import { QueryKeys } from '../../enums/query-keys'
import { fetchAlbumDiscs } from '../../api/queries/item'
import { useQuery } from '@tanstack/react-query'
import AlbumTrackListFooter from './footer'
import AlbumTrackListHeader from './header'
import Animated, { Easing, FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'
import { useStorageContext } from '../../providers/Storage'
import { useIsDownloaded } from '../../hooks/downloads'
import useDownloadTracks, { useDeleteDownloads } from '../../hooks/downloads/mutations'
import { useDownloadProgress } from 'react-native-nitro-player'

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

	const api = getApi()

	const theme = useTheme()

	const {
		data: discs,
		isPending,
		refetch,
	} = useQuery({
		queryKey: [QueryKeys.ItemTracks, album.Id],
		queryFn: () => fetchAlbumDiscs(api, album),
	})

	const downloadTracks = useDownloadTracks()

	const sections = (Array.isArray(discs) ? discs : []).map(({ title, data }) => ({
		title,
		data: Array.isArray(data) ? data : [],
	}))

	const hasMultipleSections = sections.length > 1

	const albumTrackList = discs?.flatMap((disc) => disc.data)

	const isDownloaded = useIsDownloaded(albumTrackList?.map(({ Id }) => Id) ?? [])

	const { mutate: deleteDownloads } = useDeleteDownloads()

	const handleDeleteDownload = () =>
		deleteDownloads(
			albumTrackList?.map(({ Id }) => Id).filter((id): id is string => id != null) ?? [],
		)

	const handleDownload = () => downloadTracks.mutate(albumTrackList ?? [])

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<XStack gap={'$2'} justifyContent='center' alignContent='center'>
					{albumTrackList &&
						(isDownloaded ? (
							<Animated.View
								entering={FadeIn.easing(Easing.in(Easing.ease))}
								exiting={FadeOut.easing(Easing.out(Easing.ease))}
								layout={LinearTransition.springify()}
							>
								<Icon
									color='$warning'
									name='broom'
									onPress={handleDeleteDownload}
								/>
							</Animated.View>
						) : downloadTracks.isPending ? (
							<Spinner justifyContent='center' color={'$neutral'} />
						) : (
							<Animated.View
								entering={FadeIn.easing(Easing.in(Easing.ease))}
								exiting={FadeOut.easing(Easing.out(Easing.ease))}
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
		downloadTracks.isPending,
		albumTrackList,
	])

	return (
		<SectionList
			contentInsetAdjustmentBehavior='automatic'
			contentContainerStyle={{ flexGrow: 1 }}
			sections={sections}
			keyExtractor={(item, index) => item.Id! + index}
			maxToRenderPerBatch={50}
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
			ListFooterComponent={() => <AlbumTrackListFooter album={album} freeze={isPending} />}
			ListEmptyComponent={() => (
				<YStack flex={1} alignContent='center' margin={'$4'}>
					{isPending ? null : <Text color={'$borderColor'}>No album tracks</Text>}
				</YStack>
			)}
			onScrollBeginDrag={closeAllSwipeableRows}
			refreshControl={
				<RefreshControl
					refreshing={isPending}
					onRefresh={refetch}
					tintColor={theme.primary.val}
				/>
			}
		/>
	)
}
