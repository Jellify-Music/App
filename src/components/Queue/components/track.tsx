import { skip } from '../../../hooks/player/functions/controls'
import { removeItemFromQueue } from '../../../hooks/player/functions/queue'
import getTrackDto from '../../../utils/mapping/track-extra-payload'
import { JSX, RefObject } from 'react'
import { ListRenderItemInfo, StyleSheet, View } from 'react-native'
import { DraxHandle } from 'react-native-drax'
import { GestureDetector, useTapGesture } from 'react-native-gesture-handler'
import { TrackItem } from 'react-native-nitro-player'
import Icon from '../../Global/components/icon'
import Track from '../../Global/components/Track'
import { Queue } from '../../../services/types/queue-item'
import { TapHandlerData } from 'react-native-gesture-handler/lib/typescript/v3/hooks/gestures/tap/TapTypes'
import { GestureEndEvent } from 'react-native-gesture-handler/lib/typescript/v3/types'

type QueuedTrackProps = ListRenderItemInfo<TrackItem> & {
	queueRef: Queue | undefined
	ref?: RefObject<View | null>
}

export default function QueuedTrack({
	item,
	index,
	ref,
	queueRef,
	...props
}: QueuedTrackProps): JSX.Element | undefined {
	const track = getTrackDto(item)

	const onTrackPress = async (event: GestureEndEvent<TapHandlerData>) => {
		'worklet'
		return !event.canceled && (await skip(index))
	}

	const onRemoveIconPress = async (event: GestureEndEvent<TapHandlerData>) => {
		'worklet'
		return !event.canceled && (await removeItemFromQueue(index))
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
			<View style={styles.row}>
				<DraxHandle style={styles.handle}>
					<Icon name='drag' />
				</DraxHandle>

				<GestureDetector gesture={trackPressGesture}>
					<Track
						queue={queueRef ?? 'Recently Played'}
						track={track}
						index={index}
						showArtwork
						testID={`queue-item-${index}`}
						isNested
						editing
					/>
				</GestureDetector>

				<GestureDetector gesture={removeIconPressGesture}>
					<Icon name='close' color='$warning' />
				</GestureDetector>
			</View>
		)
	)
}

const styles = StyleSheet.create({
	row: {
		flex: 1,
		alignItems: 'center',
	},
	handle: {
		display: 'flex',
		flexShrink: 1,
	},
})
