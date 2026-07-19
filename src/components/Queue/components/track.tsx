import { skip } from '../../../hooks/player/functions/controls'
import { removeItemFromQueue } from '../../../hooks/player/functions/queue'
import getTrackDto from '../../../utils/mapping/track-extra-payload'
import { JSX } from 'react'
import { ListRenderItemInfo, StyleSheet } from 'react-native'
import { DraxHandle } from 'react-native-drax'
import { GestureDetector, useTapGesture } from 'react-native-gesture-handler'
import { TrackItem } from 'react-native-nitro-player'
import { XStack } from 'tamagui'
import Icon from '../../Global/components/icon'
import Track from '../../Global/components/Track'
import { TapHandlerData } from 'react-native-gesture-handler/lib/typescript/v3/hooks/gestures/tap/TapTypes'
import { GestureEndEvent } from 'react-native-gesture-handler/lib/typescript/v3/types'
import { runOnJS } from 'react-native-worklets'
import { usePlayerQueueStore } from '../../../stores/player/queue'

type QueuedTrackProps = ListRenderItemInfo<TrackItem>

export default function QueuedTrack({ item }: QueuedTrackProps): JSX.Element | undefined {
	const track = getTrackDto(item)

	const { queueRef, queue } = usePlayerQueueStore()

	const queueIndex = queue.findIndex((queueItem) => queueItem.id === item.id)

	const onTrackPress = async (event: GestureEndEvent<TapHandlerData>) => {
		'worklet'
		return !event.canceled && queueIndex >= 0 && runOnJS(skip)(queueIndex)
	}

	const onRemoveIconPress = async (event: GestureEndEvent<TapHandlerData>) => {
		'worklet'
		return !event.canceled && queueIndex >= 0 && runOnJS(removeItemFromQueue)(queueIndex)
	}

	const trackPressGesture = useTapGesture({
		onFinalize: onTrackPress,
	})

	const removeIconPressGesture = useTapGesture({
		onFinalize: onRemoveIconPress,
	})

	return (
		track && (
			<XStack backgroundColor={'$background'} alignItems='center' marginHorizontal={'$3'}>
				<DraxHandle style={styles.handle}>
					<Icon hitSlop={20} marginRight={'$2'} small name='drag-horizontal-variant' />
				</DraxHandle>

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
		)
	)
}

const styles = StyleSheet.create({
	handle: {
		display: 'flex',
		flexShrink: 1,
	},
})
