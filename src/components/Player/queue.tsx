import Icon from '../Global/components/icon'
import Track from '../Global/components/track'
import { StackParamList } from '../types'
import { usePlayerContext } from '../../providers/Player'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import DraggableFlatList from 'react-native-draggable-flatlist'
import { Separator, XStack } from 'tamagui'
import {
	useRemoveUpcomingTracksContext,
	useRemoveFromQueueContext,
	useReorderQueueContext,
	useSkipContext,
	useQueueRefContext,
	usePlayQueueContext,
} from '../../providers/Player/queue'
import { trigger } from 'react-native-haptic-feedback'
import { isUndefined } from 'lodash'
import { useLayoutEffect } from 'react'

export default function Queue({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const { nowPlaying } = usePlayerContext()

	const playQueue = usePlayQueueContext()
	const queueRef = useQueueRefContext()
	const useRemoveUpcomingTracks = useRemoveUpcomingTracksContext()
	const useRemoveFromQueue = useRemoveFromQueueContext()
	const useReorderQueue = useReorderQueueContext()
	const useSkip = useSkipContext()

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => {
				return (
					<Icon
						name='notification-clear-all'
						onPress={() => {
							useRemoveUpcomingTracks.mutate()
						}}
					/>
				)
			},
		})
	}, [navigation])

	const scrollIndex = playQueue.findIndex(
		(queueItem) => queueItem.item.Id! === nowPlaying!.item.Id!,
	)

	return (
		<DraggableFlatList
			contentInsetAdjustmentBehavior='automatic'
			data={playQueue}
			dragHitSlop={{
				left: -50, // https://github.com/computerjazz/react-native-draggable-flatlist/issues/336
			}}
			extraData={nowPlaying}
			// enableLayoutAnimationExperimental
			getItemLayout={(data, index) => ({
				length: 20,
				offset: (20 / 9) * index,
				index,
			})}
			initialScrollIndex={scrollIndex !== -1 ? scrollIndex : 0}
			ItemSeparatorComponent={() => <Separator />}
			// itemEnteringAnimation={FadeIn}
			// itemExitingAnimation={FadeOut}
			// itemLayoutAnimation={SequencedTransition}
			keyExtractor={({ item }, index) => `${index}-${item.Id}`}
			numColumns={1}
			onDragEnd={({ from, to }) => {
				useReorderQueue({ from, to })
			}}
			renderItem={({ item: queueItem, getIndex, drag, isActive }) => (
				<XStack
					alignItems='center'
					onLongPress={(event) => {
						trigger('impactLight')
						drag()
					}}
				>
					<Track
						queue={queueRef}
						navigation={navigation}
						track={queueItem.item}
						index={getIndex() ?? 0}
						showArtwork
						testID={`queue-item-${getIndex()}`}
						onPress={() => {
							const index = getIndex()
							if (!isUndefined(index)) useSkip(index)
						}}
						onLongPress={() => {
							trigger('impactLight')
							drag()
						}}
						isNested
						showRemove
						onRemove={() => {
							const index = getIndex()
							if (!isUndefined(index)) useRemoveFromQueue.mutate(index)
						}}
					/>
				</XStack>
			)}
		/>
	)
}
