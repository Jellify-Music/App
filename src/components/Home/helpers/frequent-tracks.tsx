import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { H5, View, XStack } from 'tamagui'
import HorizontalCardList from '../../../components/Global/components/horizontal-list'
import { ItemCard } from '../../../components/Global/components/item-card'
import { QueuingType } from '../../../enums/queuing-type'
import Icon from '../../Global/components/icon'
import { useLoadNewQueue } from '../../../providers/Player/hooks/mutations'
import { H4 } from '../../../components/Global/helpers/text'
import { useDisplayContext } from '../../../providers/Display/display-provider'
import HomeStackParamList from '../../../screens/Home/types'
import { useNavigation } from '@react-navigation/native'
import { RootStackParamList } from '../../../screens/types'
import { useJellifyContext } from '../../../providers'
import { useNetworkStatus } from '../../../stores/network'
import useStreamingDeviceProfile from '../../../stores/device-profile'
import { useFrequentlyPlayedTracks } from '../../../api/queries/frequents'

export default function FrequentlyPlayedTracks(): React.JSX.Element {
	const { api } = useJellifyContext()

	const [networkStatus] = useNetworkStatus()

	const deviceProfile = useStreamingDeviceProfile()

	const tracksInfiniteQuery = useFrequentlyPlayedTracks()

	const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>()

	const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const loadNewQueue = useLoadNewQueue()
	const { horizontalItems } = useDisplayContext()

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
				data={
					(tracksInfiniteQuery.data?.length ?? 0 > horizontalItems)
						? tracksInfiniteQuery.data?.slice(0, horizontalItems)
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
		</View>
	)
}
