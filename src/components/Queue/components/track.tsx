import { skip } from '../../../hooks/player/functions/controls'
import { removeItemFromQueue, reorderQueue } from '../../../hooks/player/functions/queue'
import getTrackDto from '../../../utils/mapping/track-extra-payload'
import { JSX } from 'react'
import { StyleSheet } from 'react-native'
import { GestureDetector, useTapGesture } from 'react-native-gesture-handler'
import { TrackItem } from 'react-native-nitro-player'
import { XStack } from 'tamagui'
import Icon from '../../Global/components/icon'
import Track from '../../Global/components/Track'
import { TapHandlerData } from 'react-native-gesture-handler/lib/typescript/v3/hooks/gestures/tap/TapTypes'
import { GestureEndEvent } from 'react-native-gesture-handler/lib/typescript/v3/types'
import { usePlayerQueueStore } from '../../../stores/player/queue'
import { SortableItem, SortableRenderItemProps } from 'react-native-reanimated-dnd'

export default function QueuedTrack({
	item,
	...props
}: SortableRenderItemProps<TrackItem>): JSX.Element | undefined {
	const track = getTrackDto(item)

	const { queue, queueRef } = usePlayerQueueStore()

	const queueIndex = queue.findIndex((q) => q.id === item.id)

	const onMove = async (id: string, from: number, to: number) => {
		await reorderQueue({
			fromIndex: from,
			toIndex: to,
		})
	}

	const onTrackPress = async (event: GestureEndEvent<TapHandlerData>) => {
		'worklet'
		return !event.canceled && queueIndex >= 0 && (await skip(queueIndex))
	}

	const onRemoveIconPress = async (event: GestureEndEvent<TapHandlerData>) => {
		'worklet'
		return !event.canceled && queueIndex >= 0 && (await removeItemFromQueue(queueIndex))
	}

	const trackPressGesture = useTapGesture({
		runOnJS: true,
		onFinalize: onTrackPress,
	})

	const removeIconPressGesture = useTapGesture({
		runOnJS: true,
		onFinalize: onRemoveIconPress,
	})

	return (
		track && (
			<SortableItem data={item} onMove={onMove} {...props}>
				<XStack marginHorizontal={'$2'} alignItems='center' backgroundColor='$background'>
					<SortableItem.Handle style={styles.handle}>
						<Icon small name='drag-horizontal-variant' />
					</SortableItem.Handle>

					<GestureDetector gesture={trackPressGesture}>
						<Track
							queue={queueRef ?? 'Recently Played'}
							track={track}
							index={queueIndex}
							showArtwork
							testID={`queue-item-${queueIndex}`}
							isNested
							editing
						/>
					</GestureDetector>

					<GestureDetector gesture={removeIconPressGesture}>
						<Icon small name='minus-circle-outline' color='$warning' />
					</GestureDetector>
				</XStack>
			</SortableItem>
		)
	)
}

const styles = StyleSheet.create({
	handle: {
		display: 'flex',
		flexShrink: 1,
	},
})
