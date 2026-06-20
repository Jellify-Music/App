import { useRef } from 'react'
import { useCurrentIndex, usePlayQueue, useQueueRef } from '../../stores/player/queue'
import { TrackItem } from 'react-native-nitro-player'
import { ListRenderItemInfo, View } from 'react-native'
import { reorderQueue } from '../../hooks/player/functions/queue'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DraxList, DraxProvider, SortableReorderEvent } from 'react-native-drax'
import QueuedTrack from './components/track'
import { LegendList, LegendListRef } from '@legendapp/list/react-native'
import { itemDraxViewProps } from '../../configs/styling/drax'
import { useWindowDimensions } from 'tamagui'

export default function Queue(): React.JSX.Element {
	const queue = usePlayQueue()

	const currentIndex = useCurrentIndex()

	const queueRef = useQueueRef()

	const listRef = useRef<LegendListRef>(null)

	const trackItemRef = useRef<View | null>(null)

	const { bottom } = useSafeAreaInsets()

	const { height } = useWindowDimensions()

	const keyExtractor = (item: TrackItem) => `${item.id}`

	const onReorder = async ({ fromIndex, toIndex }: SortableReorderEvent<TrackItem>) => {
		await reorderQueue({
			fromIndex,
			toIndex,
		})
	}

	const renderItem = (props: ListRenderItemInfo<TrackItem>) => (
		<QueuedTrack {...props} queueRef={queueRef} />
	)

	const scrollToCurrentTrack = () => {
		if (currentIndex === undefined || currentIndex === null || !trackItemRef.current) return

		const scrollToY = currentIndex * trackItemRef.current.clientHeight

		listRef.current?.scrollToOffset({
			animated: true,
			offset: scrollToY,
		})
	}

	return (
		<DraxProvider>
			<DraxList<TrackItem>
				component={LegendList}
				animationConfig={'spring'}
				contentInsetAdjustmentBehavior='automatic'
				data={queue}
				keyExtractor={keyExtractor}
				ref={listRef}
				renderItem={renderItem}
				onReorder={onReorder}
				onLayout={scrollToCurrentTrack}
				style={{
					marginBottom: bottom,
				}}
				itemDraxViewProps={{
					...itemDraxViewProps,
					hoverStyle: {
						transform: [
							{
								translateY: -height,
							},
						],
					},
				}}
			/>
		</DraxProvider>
	)
}
