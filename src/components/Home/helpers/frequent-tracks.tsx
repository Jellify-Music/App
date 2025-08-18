import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useHomeContext } from '../../../providers/Home'
import { View, XStack } from 'tamagui'
import HorizontalCardList from '../../../components/Global/components/horizontal-list'
import { ItemCard } from '../../../components/Global/components/item-card'
import { QueuingType } from '../../../enums/queuing-type'
import Icon from '../../Global/components/icon'
import { useLoadQueueContext } from '../../../providers/Player/queue'
import { H4 } from '../../../components/Global/helpers/text'
import { useDisplayContext } from '../../../providers/Display/display-provider'
import HomeStackParamList from '../../../screens/Home/types'
import { useNavigation } from '@react-navigation/native'
import { RootStackParamList } from '../../../screens/types'
export default function FrequentlyPlayedTracks(): React.JSX.Element {
	const {
		frequentlyPlayed,
		fetchNextFrequentlyPlayed,
		hasNextFrequentlyPlayed,
		isFetchingFrequentlyPlayed,
	} = useHomeContext()

	const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>()

	const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const useLoadNewQueue = useLoadQueueContext()
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
							useLoadNewQueue({
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
