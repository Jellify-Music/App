import { useCurrentIndex, usePlayQueue, useQueueRef } from '../../stores/player/queue'
import { TrackItem } from 'react-native-nitro-player'
import { ListRenderItemInfo, Platform, StyleSheet } from 'react-native'
import { reorderQueue } from '../../hooks/player/functions/queue'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DraxList, DraxProvider, SortableReorderEvent } from 'react-native-drax'
import QueuedTrack from './components/track'
import { itemDraxViewProps } from '../../configs/styling/drax'
import { LegendList } from '@legendapp/list/react-native'
import { FadeOut } from 'react-native-reanimated'
import { useTheme } from 'tamagui'
import QueueListHeader from './components/header'
import { ITEM_ROW_HEIGHT } from '../../configs/styling/dimensions'

export default function Queue(): React.JSX.Element {
	const { bottom, top } = useSafeAreaInsets()

	const { background } = useTheme()

	const queue = usePlayQueue()

	const currentIndex = useCurrentIndex()

	const queueRef = useQueueRef()

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

	return (
		<DraxProvider
			style={{
				marginTop: top,
			}}
		>
			<DraxList<TrackItem>
				animationConfig={'spring'}
				contentInsetAdjustmentBehavior={'scrollableAxes'}
				component={LegendList}
				containerStyle={{
					...styles.container,
					backgroundColor: background.val,
				}}
				contentContainerStyle={{
					paddingBottom: bottom,
				}}
				ListHeaderComponent={QueueListHeader}
				data={queue}
				keyExtractor={keyExtractor}
				renderItem={renderItem}
				onReorder={onReorder}
				initialScrollIndex={currentIndex}
				itemDraxViewProps={itemDraxViewProps}
				lockToMainAxis
				itemExiting={FadeOut.springify()}
				estimatedItemSize={ITEM_ROW_HEIGHT}
				recycleItems={false} // This fucks with the dragging
			/>
		</DraxProvider>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
})
