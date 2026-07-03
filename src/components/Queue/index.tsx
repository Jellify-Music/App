import { useCurrentIndex, usePlayQueue } from '../../stores/player/queue'
import { TrackItem } from 'react-native-nitro-player'
import { reorderQueue } from '../../hooks/player/functions/queue'
import { DraxList, DraxProvider, SortableReorderEvent } from 'react-native-drax'
import QueuedTrack from './components/track'
import { itemDraxViewProps } from '../../configs/styling/drax'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ITEM_ROW_HEIGHT } from '../Global/component.config'
import { Easing, ListRenderItemInfo } from 'react-native'
import { useEffect, useRef } from 'react'
import { FadeOut } from 'react-native-reanimated'
import { LegendList, LegendListRef } from '@legendapp/list/react-native'

export default function Queue(): React.JSX.Element {
	const listRef = useRef<LegendListRef>(null)

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

	useEffect(() => {
		if (currentIndex !== undefined) {
			listRef.current?.scrollToIndex({
				index: currentIndex,
				animated: true,
			})
		}
	}, [])

	return (
		<DraxProvider>
			<DraxList<TrackItem>
				ref={listRef}
				animationConfig={'spring'}
				contentInsetAdjustmentBehavior={'never'}
				component={LegendList}
				containerStyle={{
					flex: 1,
				}}
				contentContainerStyle={{
					marginBottom: bottom,
				}}
				data={queue}
				lockToMainAxis
				itemDraxViewProps={itemDraxViewProps}
				keyExtractor={keyExtractor}
				renderItem={renderItem}
				onReorder={onReorder}
				estimatedItemSize={ITEM_ROW_HEIGHT}
				itemExiting={FadeOut.easing(Easing.ease)}
			/>
		</DraxProvider>
	)
}
