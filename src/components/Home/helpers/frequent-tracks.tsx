import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { H5, XStack } from 'tamagui'
import HorizontalCardList from '../../../components/Global/components/horizontal-list'
import ItemCard from '../../../components/Global/components/item-card'
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
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'

export default function FrequentlyPlayedTracks(): React.JSX.Element {
	const api = useApi()

	const [networkStatus] = useNetworkStatus()

	const deviceProfile = useStreamingDeviceProfile()

	const tracksInfiniteQuery = useFrequentlyPlayedTracks()

	const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>()

	const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const loadNewQueue = useLoadNewQueue()
	const { horizontalItems } = useDisplayContext()

	return tracksInfiniteQuery.data ? (
		<Animated.View
			entering={FadeIn}
			exiting={FadeOut}
			layout={LinearTransition.springify()}
			style={{
				flex: 1,
			}}
		>
			<XStack
				alignItems='center'
				onPress={() => {
					navigation.navigate('MostPlayedTracks')
				}}
			>
				<H5 marginLeft={'$2'}>On Repeat</H5>
				<Icon name='arrow-right' />
			</XStack>

			<HorizontalCardList
				data={
					tracksInfiniteQuery.data.length > horizontalItems
						? tracksInfiniteQuery.data.slice(0, horizontalItems)
						: tracksInfiniteQuery.data
				}
				renderItem={({ item: track, index }) => (
					<ItemCard
						item={track}
						size={'$11'}
						caption={track.Name}
						subCaption={`${track.Artists?.join(', ')}`}
						squared
						onPress={() => {
							loadNewQueue({
								api,
								deviceProfile,
								networkStatus,
								track,
								index,
								tracklist: tracksInfiniteQuery.data ?? [track],
								queue: 'On Repeat',
								queuingType: QueuingType.FromSelection,
								startPlayback: true,
							})
						}}
						onLongPress={() => {
							rootNavigation.navigate('Context', {
								item: track,
								navigation,
							})
						}}
						marginHorizontal={'$1'}
						captionAlign='left'
					/>
				)}
			/>
		</Animated.View>
	) : (
		<></>
	)
}
