import { useRef } from 'react'
import { useCurrentIndex, usePlayQueue, useQueueRef } from '../../stores/player/queue'
import { TrackItem } from 'react-native-nitro-player'
import { Easing, ListRenderItemInfo, StyleSheet } from 'react-native'
import { reorderQueue } from '../../hooks/player/functions/queue'
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context'
import { DraxList, DraxProvider, SortableReorderEvent } from 'react-native-drax'
import QueuedTrack from './components/track'
import { itemDraxViewProps } from '../../configs/styling/drax'
import { LegendList, LegendListRef } from '@legendapp/list/react-native'
import { FadeOut } from 'react-native-reanimated'
import { Player } from '../Player'

export default function Queue(): React.JSX.Element {
	const { height } = useSafeAreaFrame()
	const { bottom } = useSafeAreaInsets()

	const queue = usePlayQueue()

	const currentIndex = useCurrentIndex()

	const queueRef = useQueueRef()

	const listRef = useRef<LegendListRef>(null)

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
		<DraxList<TrackItem>
			component={LegendList}
			animationConfig={'spring'}
			containerStyle={styles.container}
			contentContainerStyle={{
				marginBottom: bottom,
			}}
			data={queue}
			keyExtractor={keyExtractor}
			ref={listRef}
			renderItem={renderItem}
			onReorder={onReorder}
			onLayout={scrollToCurrentTrack}
			itemDraxViewProps={itemDraxViewProps}
			lockToMainAxis
			itemExiting={FadeOut.springify()}
		/>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
})
