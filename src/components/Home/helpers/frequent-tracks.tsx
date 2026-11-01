import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { H4, H5, XStack } from 'tamagui'
import HorizontalCardList from '../../../components/Global/components/horizontal-list'
import ItemCard from '../../Global/components/Card'
import Icon from '../../Global/components/icon'
import HomeStackParamList from '../../../screens/Home/types'
import { useNavigation } from '@react-navigation/native'
import { RootStackParamList } from '../../../screens/types'
import { useFrequentlyPlayedTracks } from '../../../api/queries/frequents'
import AnimatedRow from '../../Global/helpers/Animated/row'
import { loadNewQueue } from '../../../player/queuing'

export default function FrequentlyPlayedTracks(): React.JSX.Element {
	const tracksInfiniteQuery = useFrequentlyPlayedTracks()

	const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>()

	const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	return tracksInfiniteQuery.data ? (
		<AnimatedRow testID='home-frequent-tracks'>
			<XStack
				alignItems='center'
				onPress={() => {
					navigation.navigate('MostPlayedTracks')
				}}
			>
				<H4 marginLeft='2'>On Repeat</H4>
				<Icon name='arrow-right' />
			</XStack>

			<HorizontalCardList
				data={tracksInfiniteQuery.data}
				renderItem={({ item: track, index }) => (
					<ItemCard
						item={track}
						size={'10'}
						caption={track.Name}
						subCaption={`${track.Artists?.join(', ')}`}
						squared
						onPress={async () => {
							await loadNewQueue({
								track,
								index,
								tracklist: tracksInfiniteQuery.data ?? [track],
								queue: 'On Repeat',
								startPlayback: true,
							})
						}}
						onLongPress={() => {
							rootNavigation.navigate('Context', {
								item: track,
								navigation,
							})
						}}
						marginHorizontal={'1'}
						captionAlign='left'
					/>
				)}
			/>
		</AnimatedRow>
	) : (
		<></>
	)
}
