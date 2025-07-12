import { getTokenValue, Separator } from 'tamagui'
import { useQueueContext } from '../../providers/Player/queue'
import FlashDragList from 'react-native-flashdrag-list'
import JellifyTrack from '../../types/JellifyTrack'
import { useCallback } from 'react'
import DraggableTrack from '../Global/components/draggable-track'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StackParamList } from '../types'

export default function Queue({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const { currentIndex, playQueue, reorderQueue, removeFromQueue, queueRef } = useQueueContext()

	/**
	 * Initial scroll index for the queue list
	 *
	 * Offset by 5 that way the currently playing track
	 * isn't always at the top, but rather top of the middle
	 * of the screen
	 */
	const scrollIndex = useCallback(() => {
		return currentIndex - 5
	}, [playQueue, currentIndex])

	return (
		<FlashDragList
			contentInsetAdjustmentBehavior='automatic'
			data={playQueue}
			extraData={[currentIndex]}
			itemsSize={getTokenValue('$12') + getTokenValue('$6')}
			initialScrollIndex={scrollIndex() > -1 ? scrollIndex() : 0}
			ItemSeparatorComponent={() => <Separator />}
			keyExtractor={(item: JellifyTrack) => {
				return `${item.item.Id}`
			}}
			onSort={(fromIndex, toIndex) => {
				reorderQueue({ from: fromIndex, to: toIndex })
			}}
			renderItem={({ item: track }, index, active, beginDrag) =>
				DraggableTrack({
					beginDrag,
					index,
					track,
					navigation,
					isNested: true,
					queue: queueRef,
					onRemove: () => removeFromQueue(index),
				})
			}
		/>
	)
}
