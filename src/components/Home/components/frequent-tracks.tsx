import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { H4, XStack } from 'tamagui'
import HorizontalCardList from '../../../components/Global/components/horizontal-list'
import ItemCard from '../../Global/components/Card'
import Icon from '../../Global/components/icon'
import HomeStackParamList from '../../../screens/Home/types'
import { useNavigation } from '@react-navigation/native'
import { RootStackParamList } from '../../../screens/types'
import { useFrequentlyPlayedTracks } from '../../../api/queries/frequents'
import AnimatedRow from '../../Global/utils/Animated/row'
import { loadNewQueue } from '../../../player/queuing'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { LegendListRenderItemProps } from '@legendapp/list/react-native'

export default function FrequentlyPlayedTracks(): React.JSX.Element {
	const tracksInfiniteQuery = useFrequentlyPlayedTracks()

	const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>()

	const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const renderItem = ({ item: track, index }: LegendListRenderItemProps<BaseItemDto>) => (
		<ItemCard
			item={track}
			caption={track.Name}
			subCaption={`${track.Artists?.join(', ')}`}
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
	)

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

			<HorizontalCardList data={tracksInfiniteQuery.data} renderItem={renderItem} />
		</AnimatedRow>
	) : (
		<></>
	)
}
