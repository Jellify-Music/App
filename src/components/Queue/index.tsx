import { useRef } from 'react'
import { useCurrentIndex, usePlayQueue, useQueueRef } from '../../stores/player/queue'
import { TrackItem } from 'react-native-nitro-player'
import { ListRenderItemInfo } from 'react-native'
import { reorderQueue } from '../../hooks/player/functions/queue'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DraxList, DraxProvider, SortableReorderEvent } from 'react-native-drax'
import QueuedTrack from './components/track'
import { LegendList, LegendListRef } from '@legendapp/list/react-native'
import { itemDraxViewProps } from '../../configs/styling/drax'

export default function Queue(): React.JSX.Element {
	const queue = usePlayQueue()

	const currentIndex = useCurrentIndex()

	const queueRef = useQueueRef()

	const listRef = useRef<LegendListRef>(null)

	const { bottom } = useSafeAreaInsets()

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
		if (currentIndex === undefined || currentIndex === null) return

		listRef.current?.scrollToIndex({
			animated: true,
			index: currentIndex,
		})
	}

	return (
		<DraxProvider>
			<DraxList<TrackItem>
				component={LegendList}
				animationConfig={'spring'}
				contentInsetAdjustmentBehavior='automatic'
				containerStyle={{
					flex: 1,
				}}
				data={queue}
				keyExtractor={keyExtractor}
				ref={listRef}
				renderItem={renderItem}
				onReorder={onReorder}
				onLayout={scrollToCurrentTrack}
				lockToMainAxis
				itemDraxViewProps={itemDraxViewProps}
			/>
		</DraxProvider>
	)
}
