import Icon from '../Global/components/icon'
import Track from '../Global/components/Track'
import { XStack } from 'tamagui'
import { useRef } from 'react'
import { useCurrentIndex, usePlayQueue, useQueueRef } from '../../stores/player/queue'
import Sortable from 'react-native-sortables'
import { OrderChangeParams, RenderItemInfo } from 'react-native-sortables/dist/typescript/types'
import { useReducedHapticsSetting } from '../../stores/settings/app'
import Animated, { useAnimatedRef } from 'react-native-reanimated'
import { TrackItem } from 'react-native-nitro-player'
import getTrackDto from '../../utils/mapping/track-extra-payload'
import { View } from 'react-native'
import { skip } from '../../hooks/player/functions/controls'
import { removeItemFromQueue, reorderQueue } from '../../hooks/player/functions/queue'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'

export default function Queue(): React.JSX.Element {
	const queue = usePlayQueue()

	const gesture = Gesture.Native().disallowInterruption(true)

	const currentIndex = useCurrentIndex()

	const queueRef = useQueueRef()

	const scrollableRef = useAnimatedRef<Animated.ScrollView>()

	const [reducedHaptics] = useReducedHapticsSetting()

	const trackItemRef = useRef<View | null>(null)

	const { bottom } = useSafeAreaInsets()

	const keyExtractor = (item: TrackItem) => `${item.id}`

	const renderItem = ({ item: queueItem, index }: RenderItemInfo<TrackItem>) => {
		const track = getTrackDto(queueItem)!

		const onTap = async () => await skip(index)

		return (
			<XStack alignItems='center' ref={index === 0 ? trackItemRef : undefined}>
				<Sortable.Handle style={{ display: 'flex', flexShrink: 1 }}>
					<Icon name='drag' />
				</Sortable.Handle>

				<Sortable.Touchable
					onTap={onTap}
					style={{
						flexGrow: 1,
					}}
				>
					<Track
						queue={queueRef ?? 'Recently Played'}
						track={track}
						index={index}
						showArtwork
						testID={`queue-item-${index}`}
						isNested
						editing
					/>
				</Sortable.Touchable>

				<Sortable.Touchable
					onTap={async () => {
						await removeItemFromQueue(index)
					}}
				>
					<Icon name='close' color='$warning' />
				</Sortable.Touchable>
			</XStack>
		)
	}

	const handleReorder = async ({ fromIndex, toIndex }: OrderChangeParams) =>
		await reorderQueue({ fromIndex, toIndex })

	const scrollToCurrentTrack = () => {
		if (currentIndex === undefined || currentIndex === null || !trackItemRef.current) return

		const scrollToY = currentIndex * trackItemRef.current.clientHeight

		scrollableRef.current?.scrollTo({
			y: scrollToY,
			animated: true,
		})
	}

	return (
		<GestureDetector gesture={gesture}>
			<Animated.ScrollView
				style={{
					...containerStyle,
					marginBottom: bottom,
				}}
				ref={scrollableRef}
				onLayout={scrollToCurrentTrack}
				nestedScrollEnabled
			>
				<Sortable.Grid
					autoScrollDirection='vertical'
					autoScrollEnabled
					data={queue}
					columns={1}
					keyExtractor={keyExtractor}
					renderItem={renderItem}
					onOrderChange={handleReorder}
					overDrag='vertical'
					customHandle
					hapticsEnabled={!reducedHaptics}
					scrollableRef={scrollableRef}
				/>
			</Animated.ScrollView>
		</GestureDetector>
	)
}

const containerStyle = {
	flex: 1,
}
