import { useCurrentIndex, usePlayQueue, useQueueRef } from '../../stores/player/queue'
import { TrackItem } from 'react-native-nitro-player'
import { ListRenderItemInfo, StyleSheet } from 'react-native'
import { reorderQueue } from '../../hooks/player/functions/queue'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DraxList, DraxProvider, SortableReorderEvent } from 'react-native-drax'
import QueuedTrack from './components/track'
import { itemDraxViewProps } from '../../configs/styling/drax'
import { LegendList } from '@legendapp/list/react-native'
import { FadeOut } from 'react-native-reanimated'
import { Paragraph, useTheme } from 'tamagui'
import QueueListHeader from './components/header'

export default function Queue(): React.JSX.Element {
	const { top, bottom } = useSafeAreaInsets()

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
		<DraxProvider>
			<DraxList<TrackItem>
				component={LegendList}
				animationConfig={'spring'}
				containerStyle={{
					...styles.container,
					backgroundColor: background.val,
					...StyleSheet.absoluteFill,
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
				recycleItems
			/>
		</DraxProvider>
	)
}

const styles = StyleSheet.create({
	container: {
		width: '100%',
		height: '100%',
	},
})
