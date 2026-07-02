import { skip } from '../../../hooks/player/functions/controls'
import { removeItemFromQueue } from '../../../hooks/player/functions/queue'
import getTrackDto from '../../../utils/mapping/track-extra-payload'
import { JSX } from 'react'
import { StyleSheet } from 'react-native'
import { DraxHandle } from 'react-native-drax'
import { GestureDetector, useTapGesture } from 'react-native-gesture-handler'
import { TrackItem } from 'react-native-nitro-player'
import { XStack } from 'tamagui'
import Icon from '../../Global/components/icon'
import Track from '../../Global/components/Track'
import { TapHandlerData } from 'react-native-gesture-handler/lib/typescript/v3/hooks/gestures/tap/TapTypes'
import { GestureEndEvent } from 'react-native-gesture-handler/lib/typescript/v3/types'
import { usePlayerQueueStore } from '../../../stores/player/queue'

export default function QueuedTrack({ item }: { item: TrackItem }): JSX.Element | undefined {
	const track = getTrackDto(item)

	const { queue, queueRef } = usePlayerQueueStore()

	const queueIndex = queue.findIndex((q) => q.id === item.id)

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
			<XStack marginHorizontal={'$2'} alignItems='center' backgroundColor='$background'>
				<DraxHandle style={styles.handle}>
					<Icon xsmall name='drag-horizontal-variant' />
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
					<Icon xsmall name='minus-circle-outline' color='$warning' />
				</GestureDetector>
			</XStack>
		)
	)
}

const styles = StyleSheet.create({
	handle: {
		display: 'flex',
		flexShrink: 1,
		paddingHorizontal: 4,
	},
})
