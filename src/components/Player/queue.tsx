import Icon from '../Global/components/icon'
import Track from '../Global/components/track'
import { StackParamList } from '../types'
import { usePlayerContext } from '../../providers/Player'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { getTokenValue, Separator, XStack } from 'tamagui'
import { useQueueContext } from '../../providers/Player/queue'
import { trigger } from 'react-native-haptic-feedback'
import FlashDragList from 'react-native-flashdrag-list'
import { useState } from 'react'

export default function Queue({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const { nowPlaying } = usePlayerContext()

	const { currentIndex, playQueue, queueRef, removeFromQueue, reorderQueue, skip } =
		useQueueContext()

	const scrollIndex = playQueue.findIndex(
		(queueItem) => queueItem.item.Id! === nowPlaying!.item.Id!,
	)

	const [isReordering, setIsReordering] = useState(false)

	return (
		<FlashDragList
			contentInsetAdjustmentBehavior='automatic'
			data={playQueue}
			extraData={[nowPlaying, isReordering, queueRef, currentIndex]}
			itemsSize={getTokenValue('$12') + getTokenValue('$6')}
			initialScrollIndex={scrollIndex !== -1 ? scrollIndex : 0}
			ItemSeparatorComponent={() => <Separator />}
			keyExtractor={(item, index) => {
				return `${index}-${item.Id}`
			}}
			onSort={(fromIndex, toIndex) => {
				setIsReordering(true)
				reorderQueue({ from: fromIndex, to: toIndex })
				setIsReordering(false)
			}}
			renderItem={(item, index, active, beginDrag) => (
				<XStack alignItems='center'>
					<Icon
						name='drag'
						onPressIn={() => {
							trigger('impactLight')
							beginDrag()
						}}
					/>
					<Track
						queue={queueRef}
						navigation={navigation}
						track={item.item}
						index={index}
						showArtwork
						testID={`queue-item-${index}`}
						onPress={() => {
							skip(index)
						}}
						isNested
						showRemove
						onRemove={() => {
							if (index) removeFromQueue(index)
						}}
					/>
				</XStack>
			)}
		/>
	)
}
