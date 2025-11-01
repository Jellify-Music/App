import React, { useMemo } from 'react'
import { H5, View, XStack } from 'tamagui'
import { ItemCard } from '../../Global/components/item-card'
import { RootStackParamList } from '../../../screens/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { QueuingType } from '../../../enums/queuing-type'
import HorizontalCardList from '../../../components/Global/components/horizontal-list'
import Icon from '../../Global/components/icon'
import { useLoadNewQueue } from '../../../providers/Player/hooks/mutations'
import { useDisplayContext } from '../../../providers/Display/display-provider'
import { useNavigation } from '@react-navigation/native'
import HomeStackParamList from '../../../screens/Home/types'
import { useNowPlaying } from '../../../providers/Player/hooks/queries'
import { useNetworkStatus } from '../../../stores/network'
import useStreamingDeviceProfile from '../../../stores/device-profile'
import { useRecentlyPlayedTracks } from '../../../api/queries/recents'
import { useApi } from '../../../stores'

export default function RecentlyPlayed(): React.JSX.Element {
	const api = useApi()

	const [networkStatus] = useNetworkStatus()

	const deviceProfile = useStreamingDeviceProfile()

	const { data: nowPlaying } = useNowPlaying()

	const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>()
	const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const loadNewQueue = useLoadNewQueue()

	const tracksInfiniteQuery = useRecentlyPlayedTracks()

	const { horizontalItems } = useDisplayContext()
	return useMemo(() => {
		return (
			<View>
				<XStack
					alignItems='center'
					onPress={() => {
						navigation.navigate('RecentTracks', {
							tracksInfiniteQuery,
						})
					}}
				>
					<H5 marginLeft={'$2'}>Play it again</H5>
					<Icon name='arrow-right' />
				</XStack>

				<HorizontalCardList
					data={
						(tracksInfiniteQuery.data?.length ?? 0 > horizontalItems)
							? tracksInfiniteQuery.data?.slice(0, horizontalItems)
							: tracksInfiniteQuery.data
					}
					renderItem={({ index, item: recentlyPlayedTrack }) => (
						<ItemCard
							size={'$11'}
							caption={recentlyPlayedTrack.Name}
							subCaption={`${recentlyPlayedTrack.Artists?.join(', ')}`}
							squared
							testId={`recently-played-${index}`}
							item={recentlyPlayedTrack}
							onPress={() => {
								loadNewQueue({
									api,
									deviceProfile,
									networkStatus,
									track: recentlyPlayedTrack,
									index: index,
									tracklist: tracksInfiniteQuery.data ?? [recentlyPlayedTrack],
									queue: 'Recently Played',
									queuingType: QueuingType.FromSelection,
									startPlayback: true,
								})
							}}
							onLongPress={() => {
								rootNavigation.navigate('Context', {
									item: recentlyPlayedTrack,
									navigation,
								})
							}}
							marginHorizontal={'$1'}
							captionAlign='left'
						/>
					)}
				/>
			</View>
		)
	}, [tracksInfiniteQuery.data, nowPlaying])
}
