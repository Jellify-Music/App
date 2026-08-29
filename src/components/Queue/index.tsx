import { useCurrentIndex, usePlayQueue } from '../../stores/player/queue'
import { TrackItem } from 'react-native-nitro-player'
import { ListRenderItemInfo, Platform } from 'react-native'
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context'
// NOTE: react-native-drax@1.1.0 declares `react-native-gesture-handler: ">=2.0.0"` and
// has no stated support for RNGH 3.x, which this app runs. RNGH 3 was a major rewrite
// (its new RNGestureHandlerDetectorView is what threw the "more than one child view"
// assertion fixed in Player/components/header.tsx). A gesture-heavy library sitting on
// an unsupported major is a plausible source of further drag-and-drop bugs here and in
// Playlist/index.tsx. Worth verifying against RNGH 3 or replacing.
import { DraxList, DraxProvider, SortableReorderEvent } from 'react-native-drax'
import QueuedTrack from './components/track'
import { itemDraxViewProps } from '../../configs/styling/drax'
import { LegendList } from '@legendapp/list/react-native'
import { FadeOut } from 'react-native-reanimated'
import { View } from 'tamagui'
import QueueListHeader from './components/header'
import { ITEM_ROW_HEIGHT } from '../../configs/styling/dimensions'
import { usePlayerContext } from '../../providers/Player'
import { Freeze } from 'react-freeze'
import reorderQueue from '../../player/queuing/reorder'

export default function Queue(): React.JSX.Element {
	const { height } = useSafeAreaFrame()

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
	const drawDistance = Platform.OS === 'android' ? undefined : height

	const { freezeQueue } = usePlayerContext()

	return (
		<View flex={1} backgroundColor={'$background'}>
			<QueueListHeader />

			<Freeze freeze={freezeQueue}>
				<DraxProvider>
					<DraxList<TrackItem>
						animationConfig={'spring'}
						contentInsetAdjustmentBehavior={'scrollableAxes'}
						component={LegendList}
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
						recycleItems
					/>
				</DraxProvider>
			</Freeze>
		</View>
	)
}
