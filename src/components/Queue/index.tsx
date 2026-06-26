import { useRef } from 'react'
import { useCurrentIndex, usePlayQueue, useQueueRef } from '../../stores/player/queue'
import { TrackItem } from 'react-native-nitro-player'
import { FlatList, ListRenderItemInfo, StyleSheet } from 'react-native'
import { reorderQueue } from '../../hooks/player/functions/queue'
import { SafeAreaView } from 'react-native-safe-area-context'
import { DraxList, DraxProvider, SortableReorderEvent } from 'react-native-drax'
import QueuedTrack from './components/track'
import { itemDraxViewProps } from '../../configs/styling/drax'
import { LegendList, LegendListRef } from '@legendapp/list/react-native'

export default function Queue(): React.JSX.Element {
	const queue = usePlayQueue()

	const currentIndex = useCurrentIndex()

	const queueRef = useQueueRef()

	const listRef = useRef<FlatList<TrackItem>>(null)

	const keyExtractor = (item: TrackItem) => `${item.id}`

	const onReorder = async ({ fromIndex, toIndex }: SortableReorderEvent<TrackItem>) => {
		await reorderQueue({
			fromIndex,
			toIndex,
		})
	}

	const renderItem = (props: ListRenderItemInfo<TrackItem>) => (
		<QueuedTrack {...props} queueRef={queueRef} queueIndex={queue.indexOf(props.item)} />
	)

	const scrollToCurrentTrack = () => {
		if (currentIndex === undefined || currentIndex === null) return

		listRef.current?.scrollToIndex({
			animated: true,
			index: currentIndex,
		})
	}

	return (
		<SafeAreaView style={styles.container}>
			<DraxProvider>
				<DraxList<TrackItem>
					animationConfig={'spring'}
					data={queue}
					keyExtractor={keyExtractor}
					ref={listRef}
					renderItem={renderItem}
					onReorder={onReorder}
					onLayout={scrollToCurrentTrack}
					itemDraxViewProps={itemDraxViewProps}
					lockToMainAxis
					estimatedItemSize={80}
				/>
			</DraxProvider>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
})
