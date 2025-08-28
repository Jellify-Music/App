import React, { useMemo } from 'react'
import { View, XStack } from 'tamagui'
import { useHomeContext } from '../../../providers/Home'
import { H4 } from '../../Global/helpers/text'
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
import { useJellifyContext } from '../../../providers'
import { useNetworkContext } from '../../../providers/Network'
import { useDownloadQualityContext } from '../../../providers/Settings'
import useStreamingDeviceProfile from '../../../stores/device-profile'
import { useAllDownloadedTracks } from '../../../api/queries/download'

export default function RecentlyPlayed(): React.JSX.Element {
	const { api } = useJellifyContext()

	const { networkStatus } = useNetworkContext()

	const { data: downloadedTracks } = useAllDownloadedTracks()

	const deviceProfile = useStreamingDeviceProfile()

	const downloadQuality = useDownloadQualityContext()

	const { data: nowPlaying } = useNowPlaying()

	const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>()
	const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const { mutate: loadNewQueue } = useLoadNewQueue()

	const { recentTracks, fetchNextRecentTracks, hasNextRecentTracks, isFetchingRecentTracks } =
		useHomeContext()

	const { horizontalItems } = useDisplayContext()
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
					data={
						(recentTracks?.length ?? 0 > horizontalItems)
							? recentTracks?.slice(0, horizontalItems)
							: recentTracks
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
									downloadedTracks,
									deviceProfile,
									networkStatus,
									downloadQuality,
									track: recentlyPlayedTrack,
									index: index,
									tracklist: recentTracks ?? [recentlyPlayedTrack],
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
						/>
					)}
				/>
			</View>
		)
	}, [recentTracks, nowPlaying])
}
