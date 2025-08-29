import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useHomeContext } from '../../../providers/Home'
import { View, XStack } from 'tamagui'
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
import { useNetworkContext } from '../../../providers/Network'
import useStreamingDeviceProfile from '../../../stores/device-profile'

export default function FrequentlyPlayedTracks(): React.JSX.Element {
	const { api } = useJellifyContext()

	const { networkStatus } = useNetworkContext()

	const deviceProfile = useStreamingDeviceProfile()

	const {
		frequentlyPlayed,
		fetchNextFrequentlyPlayed,
		hasNextFrequentlyPlayed,
		isFetchingFrequentlyPlayed,
	} = useHomeContext()

	const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>()

	const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const { mutate: loadNewQueue } = useLoadNewQueue()
	const { horizontalItems } = useDisplayContext()

	return (
		<View>
			<XStack
				alignItems='center'
				onPress={() => {
					navigation.navigate('MostPlayedTracks', {
						tracks: frequentlyPlayed,
						fetchNextPage: fetchNextFrequentlyPlayed,
						hasNextPage: hasNextFrequentlyPlayed,
						isPending: isFetchingFrequentlyPlayed,
					})
				}}
			>
				<H4 marginLeft={'$2'}>On Repeat</H4>
				<Icon name='arrow-right' />
			</XStack>

			<HorizontalCardList
				data={
					(frequentlyPlayed?.length ?? 0 > horizontalItems)
						? frequentlyPlayed?.slice(0, horizontalItems)
						: frequentlyPlayed
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
								tracklist: frequentlyPlayed ?? [track],
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
					/>
				)}
			/>
		</View>
	)
}
