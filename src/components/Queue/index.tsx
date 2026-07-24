import { useCurrentIndex, usePlayQueue } from '../../stores/player/queue'
import { TrackItem } from 'react-native-nitro-player'
import { ListRenderItemInfo, Platform, StyleSheet } from 'react-native'
import { reorderQueue } from '../../hooks/player/functions/queue'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DraxList, DraxProvider, SortableReorderEvent } from 'react-native-drax'
import QueuedTrack from './components/track'
import { itemDraxViewProps } from '../../configs/styling/drax'
import { LegendList } from '@legendapp/list/react-native'
import { FadeOut } from 'react-native-reanimated'
import { View } from 'tamagui'
import QueueListHeader from './components/header'
import { ITEM_ROW_HEIGHT } from '../../configs/styling/dimensions'

export default function Queue(): React.JSX.Element {
	const { bottom } = useSafeAreaInsets()

	const queue = usePlayQueue()

	const currentIndex = useCurrentIndex()

	const keyExtractor = (item: TrackItem) => `${item.id}`

	const onReorder = async ({ fromIndex, toIndex }: SortableReorderEvent<TrackItem>) => {
		await reorderQueue({
			fromIndex,
			toIndex,
		})
	}

	const renderItem = (props: ListRenderItemInfo<TrackItem>) => <QueuedTrack {...props} />

	/**
	 * For reasons unknown to humanity (at this time), this {@link DraxList} works better if the
	 * default drawDistance from {@link LegendList} is used on Android, but better if the list is
	 * more eagerly drawn on iOS.
	 *
	 * @see https://legendapp.com/open-source/list/v3/api/#drawdistance
	 */
	const drawDistance = Platform.OS === 'android' ? undefined : ITEM_ROW_HEIGHT * queue.length

	return (
		<View flex={1} backgroundColor={'$background'}>
			<QueueListHeader />

			<DraxProvider>
				<DraxList<TrackItem>
					animationConfig={'spring'}
					contentInsetAdjustmentBehavior={'scrollableAxes'}
					component={LegendList}
					containerStyle={styles.container}
					contentContainerStyle={{
						paddingBottom: bottom,
					}}
					extraData={currentIndex}
					data={queue}
					keyExtractor={keyExtractor}
					renderItem={renderItem}
					onReorder={onReorder}
					initialScrollIndex={currentIndex}
					initialScrollOffset={ITEM_ROW_HEIGHT}
					itemDraxViewProps={itemDraxViewProps}
					lockToMainAxis
					itemExiting={FadeOut.springify()}
					estimatedItemSize={ITEM_ROW_HEIGHT}
					drawDistance={drawDistance}
				/>
			</DraxProvider>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
})
