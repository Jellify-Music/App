import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { H5, View, XStack } from 'tamagui'
import HorizontalCardList from '../../../components/Global/components/horizontal-list'
import { ItemCard } from '../../../components/Global/components/item-card'
import { QueuingType } from '../../../enums/queuing-type'
import Icon from '../../Global/components/icon'
import { useLoadNewQueue } from '../../../providers/Player/hooks/mutations'
import { useDisplayContext } from '../../../providers/Display/display-provider'
import HomeStackParamList from '../../../screens/Home/types'
import { useNavigation } from '@react-navigation/native'
import { RootStackParamList } from '../../../screens/types'
import { useNetworkStatus } from '../../../stores/network'
import useStreamingDeviceProfile from '../../../stores/device-profile'
import { useFrequentlyPlayedTracks } from '../../../api/queries/frequents'
import { useApi } from '../../../stores'
import { useCallback, useMemo } from 'react'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'

export default function FrequentlyPlayedTracks(): React.JSX.Element {
	const api = useApi()

	const [networkStatus] = useNetworkStatus()

	const deviceProfile = useStreamingDeviceProfile()

	const tracksInfiniteQuery = useFrequentlyPlayedTracks()

	const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>()

	const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const loadNewQueue = useLoadNewQueue()
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
				queue: 'On Repeat',
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
		({ item: track, index }: { item: BaseItemDto; index: number }) => (
			<ItemCard
				item={track}
				size={'$11'}
				caption={track.Name}
				subCaption={track.Artists?.join(', ')}
				squared
				onPress={() => handleTrackPress(track, index)}
				onLongPress={() => handleTrackLongPress(track)}
				marginHorizontal={'$1'}
				captionAlign='left'
			/>
		),
		[handleTrackPress, handleTrackLongPress],
	)

	const displayData = useMemo(
		() =>
			(tracksInfiniteQuery.data?.length ?? 0) > horizontalItems
				? tracksInfiniteQuery.data?.slice(0, horizontalItems)
				: tracksInfiniteQuery.data,
		[tracksInfiniteQuery.data, horizontalItems],
	)

	return (
		<View>
			<XStack
				alignItems='center'
				onPress={() => {
					navigation.navigate('MostPlayedTracks', {
						tracksInfiniteQuery,
					})
				}}
			>
				<H5 marginLeft={'$2'}>On Repeat</H5>
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
