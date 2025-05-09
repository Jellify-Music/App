import React, { useMemo } from 'react'
import { View, XStack } from 'tamagui'
import { useHomeContext } from '../../../providers/Home'
import { H2, H4 } from '../../Global/helpers/text'
import { ItemCard } from '../../Global/components/item-card'
import { usePlayerContext } from '../../../providers/Player'
import { StackParamList } from '../../../components/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { trigger } from 'react-native-haptic-feedback'
import { QueuingType } from '../../../enums/queuing-type'
import HorizontalCardList from '../../../components/Global/components/horizontal-list'
import Icon from '../../../components/Global/helpers/icon'
import { useQueueContext } from '../../../providers/Player/queue'

export default function RecentlyPlayed({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const { nowPlaying, useStartPlayback } = usePlayerContext()
	const { useLoadNewQueue } = useQueueContext()
	const { recentTracks, fetchNextRecentTracks, hasNextRecentTracks, isFetchingRecentTracks } =
		useHomeContext()

	return useMemo(() => {
		return (
			<View>
				<XStack
					alignItems='center'
					onPress={() => {
						navigation.navigate('RecentTracks', {
							tracks: recentTracks,
							fetchNextPage: fetchNextRecentTracks,
							hasNextPage: hasNextRecentTracks,
							isPending: isFetchingRecentTracks,
						})
					}}
				>
					<H4 marginLeft={'$2'}>Play it again</H4>
					<Icon name='arrow-right' />
				</XStack>

				<HorizontalCardList
					squared
					data={
						(recentTracks?.pages.flatMap((page) => page).length ?? 0 > 10)
							? recentTracks?.pages.flatMap((page) => page).slice(0, 10)
							: recentTracks?.pages.flatMap((page) => page)
					}
					renderItem={({ index, item: recentlyPlayedTrack }) => (
						<ItemCard
							size={'$11'}
							caption={recentlyPlayedTrack.Name}
							subCaption={`${recentlyPlayedTrack.Artists?.join(', ')}`}
							squared
							item={recentlyPlayedTrack}
							onPress={() => {
								useLoadNewQueue.mutate(
									{
										track: recentlyPlayedTrack,
										index: index,
										tracklist: recentTracks?.pages.flatMap((page) => page) ?? [
											recentlyPlayedTrack,
										],
										queue: 'Recently Played',
										queuingType: QueuingType.FromSelection,
									},
									{
										onSuccess: () => useStartPlayback.mutate(),
									},
								)
							}}
							onLongPress={() => {
								trigger('impactMedium')
								navigation.navigate('Details', {
									item: recentlyPlayedTrack,
									isNested: false,
								})
							}}
						/>
					)}
				/>
			</View>
		)
	}, [recentTracks, nowPlaying])
}
