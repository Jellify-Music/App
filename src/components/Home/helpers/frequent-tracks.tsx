import { StackParamList } from '../../types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useHomeContext } from '../../../providers/Home'
import { View, XStack } from 'tamagui'
import HorizontalCardList from '../../../components/Global/components/horizontal-list'
import { ItemCard } from '../../../components/Global/components/item-card'
import { QueuingType } from '../../../enums/queuing-type'
import { trigger } from 'react-native-haptic-feedback'
import Icon from '../../Global/components/icon'
import { useQueueContext } from '../../../providers/Player/queue'
import { usePlayerContext } from '../../../providers/Player'
import { H4 } from '../../../components/Global/helpers/text'
import { useDisplayContext } from '../../../providers/Display/display-provider'
export default function FrequentlyPlayedTracks({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const {
		frequentlyPlayed,
		fetchNextFrequentlyPlayed,
		hasNextFrequentlyPlayed,
		isFetchingFrequentlyPlayed,
	} = useHomeContext()

	const { useStartPlayback } = usePlayerContext()
	const { useLoadNewQueue } = useQueueContext()
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
					(frequentlyPlayed?.pages.flatMap((page) => page).length ?? 0 > horizontalItems)
						? frequentlyPlayed?.pages.flatMap((page) => page).slice(0, horizontalItems)
						: frequentlyPlayed?.pages.flatMap((page) => page)
				}
				renderItem={({ item: track, index }) => (
					<ItemCard
						item={track}
						size={'$11'}
						caption={track.Name}
						subCaption={`${track.Artists?.join(', ')}`}
						squared
						onPress={() => {
							useLoadNewQueue.mutate(
								{
									track,
									index,
									tracklist: frequentlyPlayed?.pages.flatMap((page) => page) ?? [
										track,
									],
									queue: 'On Repeat',
									queuingType: QueuingType.FromSelection,
								},
								{
									onSuccess: () => useStartPlayback.mutate(),
								},
							)
						}}
						onLongPress={() => {
							trigger('impactMedium')
							navigation.navigate('Details', {
								item: track,
								isNested: false,
							})
						}}
					/>
				)}
			/>
		</View>
	)
}
