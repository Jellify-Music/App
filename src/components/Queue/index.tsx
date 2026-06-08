import Icon from '../Global/components/icon'
import Track from '../Global/components/Track'
import { XStack } from 'tamagui'
import { useRef, useState } from 'react'
import { useCurrentIndex, usePlayQueue, useQueueRef } from '../../stores/player/queue'
import Animated, { useAnimatedRef } from 'react-native-reanimated'
import { TrackItem } from 'react-native-nitro-player'
import getTrackDto from '../../utils/mapping/track-extra-payload'
import { ListRenderItemInfo, StyleSheet, View } from 'react-native'
import { skip } from '../../hooks/player/functions/controls'
import { removeItemFromQueue, reorderQueue } from '../../hooks/player/functions/queue'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { GestureDetector, useNativeGesture } from 'react-native-gesture-handler'
import {
	DraxHandle,
	DraxList,
	DraxProvider,
	DraxView,
	SortableItem,
	SortableReorderEvent,
} from 'react-native-drax'

export default function Queue(): React.JSX.Element {
	const queue = usePlayQueue()

	const gesture = useNativeGesture({
		disallowInterruption: true,
	})

	const currentIndex = useCurrentIndex()

	const queueRef = useQueueRef()

	const scrollableRef = useAnimatedRef<Animated.ScrollView>()

	const trackItemRef = useRef<View | null>(null)

	const { bottom } = useSafeAreaInsets()

	const keyExtractor = (item: TrackItem) => `${item.id}`

	const onReorder = async ({ fromIndex, toIndex }: SortableReorderEvent<TrackItem>) => {
		await reorderQueue({
			fromIndex,
			toIndex,
		})
	}

	const renderItem = ({ item: queueItem, index, ...props }: ListRenderItemInfo<TrackItem>) => {
		const track = getTrackDto(queueItem)!

		const onPress = async () => await skip(index)

		const onDelete = async () => await removeItemFromQueue(index)

		return (
			<DraxView dragHandle>
				<XStack flex={1} alignItems='center' ref={index === 0 ? trackItemRef : undefined}>
					<DraxHandle style={styles.handle}>
						<Icon name='drag' />
					</DraxHandle>

					<Track
						queue={queueRef ?? 'Recently Played'}
						track={track}
						index={index}
						showArtwork
						testID={`queue-item-${index}`}
						isNested
						editing
						onPress={onPress}
					/>

					<Icon name='close' color='$warning' flexShrink={1} onPress={onDelete} />
				</XStack>
			</DraxView>
		)
	}

	const scrollToCurrentTrack = () => {
		if (currentIndex === undefined || currentIndex === null || !trackItemRef.current) return

		const scrollToY = currentIndex * trackItemRef.current.clientHeight

		scrollableRef.current?.scrollTo({
			y: scrollToY,
			animated: true,
		})
	}

	return (
		<DraxProvider>
			<Animated.ScrollView
				style={{
					...styles.container,
					marginBottom: bottom,
				}}
				ref={scrollableRef}
				onLayout={scrollToCurrentTrack}
				nestedScrollEnabled
			>
				<DraxList<TrackItem>
					data={queue}
					keyExtractor={keyExtractor}
					renderItem={renderItem}
					itemHeight={50}
					onReorder={onReorder}
				/>
			</Animated.ScrollView>
		</DraxProvider>
	)
}

const styles = StyleSheet.create({
	handle: {
		display: 'flex',
		flexShrink: 1,
	},
	container: {
		flex: 1,
	},
})
