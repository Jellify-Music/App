import React, { useCallback, useEffect } from 'react'
import Track from '../Global/components/track'
import { FlatList } from 'react-native'
import { getTokens, Separator } from 'tamagui'
import { StackParamList } from '../types'
import { BaseItemDto, UserItemDataDto } from '@jellyfin/sdk/lib/generated-client/models'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Queue } from '../../player/types/queue-item'
import { InfiniteData } from '@tanstack/react-query'
import { useNetworkContext } from '../../providers/Network'
import { queryClient } from '../../constants/query-client'
import { QueryKeys } from '../../enums/query-keys'

export default function Tracks({
	tracks,
	queue,
	fetchNextPage,
	hasNextPage,
	navigation,
	filterDownloaded,
	filterFavorites,
}: {
	tracks: InfiniteData<BaseItemDto[], unknown> | undefined
	queue: Queue
	fetchNextPage: () => void
	hasNextPage: boolean
	navigation: NativeStackNavigationProp<StackParamList>
	filterDownloaded?: boolean | undefined
	filterFavorites?: boolean | undefined
}): React.JSX.Element {
	const { downloadedTracks } = useNetworkContext()

	const tracksToDisplay: () => BaseItemDto[] = useCallback(() => {
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
		return tracks?.pages.flatMap((page) => page) ?? []
	}, [filterDownloaded, downloadedTracks, tracks, filterFavorites])

	return (
		<FlatList
			contentInsetAdjustmentBehavior='automatic'
			contentContainerStyle={{
				marginVertical: getTokens().size.$1.val,
			}}
			ItemSeparatorComponent={() => <Separator />}
			numColumns={1}
			data={tracksToDisplay()}
			renderItem={({ index, item: track }) => (
				<Track
					navigation={navigation}
					showArtwork
					index={0}
					track={track}
					tracklist={tracksToDisplay().slice(index, index + 50)}
					queue={queue}
				/>
			)}
			removeClippedSubviews
			onEndReached={() => {
				if (hasNextPage) fetchNextPage()
			}}
			onEndReachedThreshold={0.0}
		/>
	)
}
