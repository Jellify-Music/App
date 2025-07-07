import Icon from '../Global/components/icon'
import Track from '../Global/components/track'
import { StackParamList } from '../types'
import { usePlayerContext } from '../../providers/Player'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import DraggableFlatList from 'react-native-draggable-flatlist'
import { Separator, XStack } from 'tamagui'
import { useQueueContext } from '../../providers/Player/queue'
import Animated from 'react-native-reanimated'
import { Gesture } from 'react-native-gesture-handler'
import { useState } from 'react'
import { trigger } from 'react-native-haptic-feedback'

const gesture = Gesture.Pan().runOnJS(true)

export default function Queue({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const { nowPlaying } = usePlayerContext()

	const {
		playQueue,
		queueRef,
		useRemoveUpcomingTracks,
		useRemoveFromQueue,
		useReorderQueue,
		useSkip,
	} = useQueueContext()

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

	const scrollIndex = playQueue.findIndex(
		(queueItem) => queueItem.item.Id! === nowPlaying!.item.Id!,
	)

	const [isReordering, setIsReordering] = useState(false)

	return (
		<Animated.View>
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
				keyExtractor={({ item }, index) => {
					return `${index}-${item.Id}`
				}}
				numColumns={1}
				onDragBegin={() => {
					// setIsReordering(true)
				}}
				onDragEnd={({ from, to }) => {
					setIsReordering(false)
					useReorderQueue.mutate({ from, to })
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
							onPress={() => {
								useSkip.mutate(getIndex())
							}}
							onLongPress={() => {
								trigger('impactLight')
								drag()
							}}
							isNested
							showRemove
							onRemove={() => {
								if (getIndex()) useRemoveFromQueue.mutate(getIndex()!)
							}}
						/>
					</XStack>
				)}
			/>
		</Animated.View>
	)
}
