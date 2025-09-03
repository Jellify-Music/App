import React from 'react'
import Track from '../Global/components/track'
import { getTokens, Separator } from 'tamagui'
import { BaseItemDto, UserItemDataDto } from '@jellyfin/sdk/lib/generated-client/models'
import { Queue } from '../../player/types/queue-item'
import { queryClient } from '../../constants/query-client'
import { FlashList } from '@shopify/flash-list'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '../../screens/types'
import { useAllDownloadedTracks } from '../../api/queries/download'
import UserDataQueryKey from '../../api/queries/user-data/keys'
import { useJellifyContext } from '../../providers'

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
	const { user } = useJellifyContext()

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
									queryClient.getQueryData(
										UserDataQueryKey(user!, downloadedTrack),
									) as UserItemDataDto | undefined
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
