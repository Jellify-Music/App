import { useCurrentIndex, usePlayQueue } from '../../stores/player/queue'
import { TrackItem } from 'react-native-nitro-player'
import { reorderQueue } from '../../hooks/player/functions/queue'
import { DraxList, DraxProvider, SortableReorderEvent } from 'react-native-drax'
import QueuedTrack from './components/track'
import { itemDraxViewProps } from '../../configs/styling/drax'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LegendList } from '@legendapp/list/react-native'
import { ITEM_ROW_HEIGHT } from '../Global/component.config'
import { ListRenderItemInfo } from 'react-native'
import QueueTracklistHeader from './components/header'

export default function Queue(): React.JSX.Element {
	const queue = usePlayQueue()

	const currentIndex = useCurrentIndex()

	const keyExtractor = (item: TrackItem) => `${item.id}`

	const onReorder = async ({ fromIndex, toIndex }: SortableReorderEvent<TrackItem>) =>
		await reorderQueue({
			fromIndex,
			toIndex,
		})

	const { bottom } = useSafeAreaInsets()

	const renderItem = ({ item }: ListRenderItemInfo<TrackItem>) => <QueuedTrack item={item} />

	return (
		<DraxProvider>
			<DraxList<TrackItem>
				initialScrollIndex={currentIndex}
				animationConfig={'spring'}
				component={LegendList}
				contentInsetAdjustmentBehavior='automatic'
				containerStyle={{
					flex: 1,
					marginBottom: bottom,
				}}
				data={queue}
				lockToMainAxis
				itemDraxViewProps={itemDraxViewProps}
				keyExtractor={keyExtractor}
				renderItem={renderItem}
				onReorder={onReorder}
				estimatedItemSize={ITEM_ROW_HEIGHT}
			/>
		</DraxProvider>
	)
}
