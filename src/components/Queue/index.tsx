import { useRef } from 'react'
import { useCurrentIndex, usePlayQueue, useQueueRef } from '../../stores/player/queue'
import { TrackItem } from 'react-native-nitro-player'
import { ListRenderItemInfo, View } from 'react-native'
import { reorderQueue } from '../../hooks/player/functions/queue'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
	DraxList,
	DraxProvider,
	SortableContainer,
	SortableItem,
	SortableReorderEvent,
	useSortableList,
} from 'react-native-drax'
import QueuedTrack from './components/track'
import { LegendList, LegendListRef, LegendListRenderItemProps } from '@legendapp/list/react-native'

export default function Queue(): React.JSX.Element {
	const queue = usePlayQueue()

	const currentIndex = useCurrentIndex()

	const queueRef = useQueueRef()

	const listRef = useRef<LegendListRef>(null)

	const trackItemRef = useRef<View | null>(null)

	const { bottom } = useSafeAreaInsets()

	const keyExtractor = (item: TrackItem) => `${item.id}`

	const onReorder = async ({ fromIndex, toIndex }: SortableReorderEvent<TrackItem>) => {
		await reorderQueue({
			fromIndex,
			toIndex,
		})
	}

	const sortable = useSortableList({
		data: queue,
		keyExtractor,
		onReorder,
	})

	const scrollToCurrentTrack = () => {
		if (currentIndex === undefined || currentIndex === null || !trackItemRef.current) return

		const scrollToY = currentIndex * trackItemRef.current.clientHeight

		listRef.current?.scrollToOffset({
			animated: true,
			offset: scrollToY,
		})
	}

	const renderItem = (props: LegendListRenderItemProps<TrackItem>) => (
		<SortableItem sortable={sortable} index={props.index} dragHandle>
			<QueuedTrack {...props} queueRef={queueRef} />
		</SortableItem>
	)

	return (
		<DraxProvider>
			<SortableContainer sortable={sortable} scrollRef={listRef}>
				<LegendList
					contentInsetAdjustmentBehavior='automatic'
					data={sortable.data}
					keyExtractor={sortable.stableKeyExtractor}
					ref={listRef}
					renderItem={renderItem}
					onLayout={scrollToCurrentTrack}
					style={{
						marginBottom: bottom,
					}}
					onScroll={sortable.onScroll}
					onContentSizeChange={sortable.onContentSizeChange}
				/>
			</SortableContainer>
		</DraxProvider>
	)
}
