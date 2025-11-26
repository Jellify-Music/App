import React, { useCallback, useMemo } from 'react'
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
import { useNetworkStatus } from '../../../stores/network'
import useStreamingDeviceProfile from '../../../stores/device-profile'
import { useRecentlyPlayedTracks } from '../../../api/queries/recents'
import { useApi } from '../../../stores'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'

export default function RecentlyPlayed(): React.JSX.Element {
	const api = useApi()

	const [networkStatus] = useNetworkStatus()

	const deviceProfile = useStreamingDeviceProfile()

	const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>()
	const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const loadNewQueue = useLoadNewQueue()

	const tracksInfiniteQuery = useRecentlyPlayedTracks()

	const { horizontalItems } = useDisplayContext()

	const tracklist = useMemo(() => tracksInfiniteQuery.data ?? [], [tracksInfiniteQuery.data])

	const handleTrackPress = useCallback(
		(track: BaseItemDto, index: number) => {
			loadNewQueue({
				api,
				deviceProfile,
				networkStatus,
				track,
				index,
				tracklist,
				queue: 'Recently Played',
				queuingType: QueuingType.FromSelection,
				startPlayback: true,
			})
		},
		[api, deviceProfile, networkStatus, tracklist, loadNewQueue],
	)

	const handleTrackLongPress = useCallback(
		(track: BaseItemDto) => {
			rootNavigation.navigate('Context', {
				item: track,
				navigation,
			})
		},
		[rootNavigation, navigation],
	)

	const renderItem = useCallback(
		({ index, item: recentlyPlayedTrack }: { index: number; item: BaseItemDto }) => (
			<ItemCard
				size={'$11'}
				caption={recentlyPlayedTrack.Name}
				subCaption={recentlyPlayedTrack.Artists?.join(', ')}
				squared
				testId={`recently-played-${index}`}
				item={recentlyPlayedTrack}
				onPress={() => handleTrackPress(recentlyPlayedTrack, index)}
				onLongPress={() => handleTrackLongPress(recentlyPlayedTrack)}
				marginHorizontal={'$1'}
				captionAlign='left'
			/>
		),
		[handleTrackPress, handleTrackLongPress],
	)

	const displayData = useMemo(() => {
		const data = tracksInfiniteQuery.data ?? []
		// Deduplicate by Id to prevent key conflicts
		const seen = new Set<string>()
		const unique = data.filter((track) => {
			if (!track.Id || seen.has(track.Id)) return false
			seen.add(track.Id)
			return true
		})
		return unique.slice(0, horizontalItems)
	}, [tracksInfiniteQuery.data, horizontalItems])

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
				data={displayData}
				renderItem={renderItem}
				keyExtractor={(item) => item.Id!}
			/>
		</View>
	)
}
