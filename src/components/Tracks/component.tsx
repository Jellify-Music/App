import React, { useRef } from 'react'
import Track from '../Global/components/track'
import { getTokens, Separator } from 'tamagui'
import { BaseItemDto, UserItemDataDto } from '@jellyfin/sdk/lib/generated-client/models'
import { Queue } from '../../player/types/queue-item'
import { useNetworkContext } from '../../providers/Network'
import { queryClient } from '../../constants/query-client'
import { QueryKeys } from '../../enums/query-keys'
import { FlashList, ViewToken } from '@shopify/flash-list'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '../../screens/types'
import { warmItemContext } from '../../hooks/use-item-context'
import { useJellifyContext } from '../../providers'
import useStreamingDeviceProfile from '../../stores/device-profile'
import { useAllDownloadedTracks } from '../../api/queries/download'

interface TracksProps {
	tracks: (string | number | BaseItemDto)[] | undefined
	navigation: Pick<NativeStackNavigationProp<BaseStackParamList>, 'navigate' | 'dispatch'>
	queue: Queue
	fetchNextPage: () => void
	hasNextPage: boolean
	filterDownloaded?: boolean | undefined
	filterFavorites?: boolean | undefined
}

export default function Tracks({
	tracks,
	navigation,
	queue,
	fetchNextPage,
	hasNextPage,
	filterDownloaded,
	filterFavorites,
}: TracksProps): React.JSX.Element {
	const { api, user } = useJellifyContext()

	const deviceProfile = useStreamingDeviceProfile()
	const { data: downloadedTracks } = useAllDownloadedTracks()

	// Memoize the expensive tracks processing to prevent memory leaks
	const tracksToDisplay = React.useMemo(() => {
		if (filterDownloaded) {
			return (
				downloadedTracks
					?.map((downloadedTrack) => downloadedTrack.item)
					.filter((downloadedTrack) => {
						if (filterFavorites) {
							return (
								(
									queryClient.getQueryData([
										QueryKeys.UserData,
										downloadedTrack.Id,
									]) as UserItemDataDto | undefined
								)?.IsFavorite ?? false
							)
						}
						return true
					}) ?? []
			)
		}
		return tracks?.filter((track) => typeof track === 'object') ?? []
	}, [filterDownloaded, downloadedTracks, tracks, filterFavorites])

	// Memoize key extraction for FlashList performance
	const keyExtractor = React.useCallback((item: BaseItemDto) => item.Id!, [])

	// Memoize render item to prevent recreation
	const renderItem = React.useCallback(
		({ index, item: track }: { index: number; item: BaseItemDto }) => (
			<Track
				navigation={navigation}
				showArtwork
				index={0}
				track={track}
				tracklist={tracksToDisplay.slice(index, index + 50)}
				queue={queue}
			/>
		),
		[tracksToDisplay, queue],
	)

	const onViewableItemsChangedRef = useRef(
		({ viewableItems }: { viewableItems: ViewToken<BaseItemDto>[] }) => {
			viewableItems.forEach(({ isViewable, item }) => {
				if (isViewable) warmItemContext(api, user, item, deviceProfile)
			})
		},
	)

	return (
		<FlashList
			contentInsetAdjustmentBehavior='automatic'
			contentContainerStyle={{
				paddingVertical: getTokens().size.$1.val,
			}}
			ItemSeparatorComponent={() => <Separator />}
			numColumns={1}
			data={tracksToDisplay}
			keyExtractor={keyExtractor}
			renderItem={renderItem}
			onEndReached={() => {
				if (hasNextPage) fetchNextPage()
			}}
			removeClippedSubviews
		/>
	)
}
