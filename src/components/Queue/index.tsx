import Icon from '../Global/components/icon'
import Track from '../Global/components/Track'
import { RootStackParamList } from '../../screens/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Text, XStack } from 'tamagui'
import { useLayoutEffect, useRef, useState } from 'react'
import { LayoutChangeEvent, useWindowDimensions } from 'react-native'
import JellifyTrack from '../../types/JellifyTrack'
import {
	useRemoveFromQueue,
	useRemoveUpcomingTracks,
	useReorderQueue,
	useSkip,
} from '../../hooks/player/callbacks'
import { useCurrentIndex, usePlayerQueueStore, useQueueRef } from '../../stores/player/queue'
import Sortable from 'react-native-sortables'
import { OrderChangeParams, RenderItemInfo } from 'react-native-sortables/dist/typescript/types'
import { useReducedHapticsSetting } from '../../stores/settings/app'
import Animated, { useAnimatedRef } from 'react-native-reanimated'
import TrackPlayer from 'react-native-track-player'
import TRACK_ITEM_HEIGHT from './config'

// Persist row height across mounts so we can set contentOffset before first layout (no visible scroll)
let lastMeasuredRowHeight: number | null = null

function getInitialScrollY(index: number, windowHeight: number, rowHeight: number): number {
	const topOffset = windowHeight * 0.5
	const rowsOverScroll = 6.3
	return Math.max(0, index * rowHeight + topOffset - rowHeight / 2 - rowsOverScroll * rowHeight)
}

export default function Queue({
	navigation,
}: {
	navigation: NativeStackNavigationProp<RootStackParamList>
}): React.JSX.Element {
	const playQueue = usePlayerQueueStore.getState().queue
	const [queue, setQueue] = useState<JellifyTrack[]>(playQueue)

	const currentIndexFromStore = useCurrentIndex()

	const queueRef = useQueueRef()
	const removeUpcomingTracks = useRemoveUpcomingTracks()
	const removeFromQueue = useRemoveFromQueue()
	const reorderQueue = useReorderQueue()
	const skip = useSkip()

	const scrollableRef = useAnimatedRef<Animated.ScrollView>()

	const [reducedHaptics] = useReducedHapticsSetting()
	const { height: windowHeight } = useWindowDimensions()
	const hasScrolledToCurrentRef = useRef(false)
	const rowHeightRef = useRef<number | null>(null)

	const scrollToCurrentSong = (measuredRowHeight: number) => {
		if (hasScrolledToCurrentRef.current) return
		const index = currentIndexFromStore ?? 0
		const scrollY = getInitialScrollY(index, windowHeight, measuredRowHeight)
		scrollableRef.current?.scrollTo({ y: scrollY, animated: false })
		hasScrolledToCurrentRef.current = true
	}

	const handleFirstRowLayout = (e: LayoutChangeEvent) => {
		const height = e.nativeEvent.layout.height
		if (rowHeightRef.current === null) {
			const hadCachedHeight = lastMeasuredRowHeight !== null
			rowHeightRef.current = height
			lastMeasuredRowHeight = height
			// Only correct with scroll when we used TRACK_ITEM_HEIGHT for contentOffset (first open)
			if (!hadCachedHeight) {
				scrollToCurrentSong(height)
			}
		}
	}

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => {
				return (
					<XStack gap='$1'>
						<Text color={'$warning'} marginVertical={'auto'} fontWeight={'bold'}>
							Clear
						</Text>
						<Icon
							name='broom'
							color='$warning'
							onPress={async () => {
								await removeUpcomingTracks()
								setQueue((await TrackPlayer.getQueue()) as JellifyTrack[])
							}}
						/>
					</XStack>
				)
			},
		})
	}, [])

	const keyExtractor = (item: JellifyTrack) => `${item.item.Id}`

	// Memoize renderItem function for better performance
	const renderItem = ({ item: queueItem, index }: RenderItemInfo<JellifyTrack>) => (
		<XStack alignItems='center' onLayout={index === 0 ? handleFirstRowLayout : undefined}>
			<Sortable.Handle style={{ display: 'flex', flexShrink: 1 }}>
				<Icon name='drag' />
			</Sortable.Handle>

			<Sortable.Touchable
				onTap={() => skip(index)}
				style={{
					flexGrow: 1,
				}}
			>
				<Track
					queue={queueRef ?? 'Recently Played'}
					track={queueItem.item}
					index={index}
					showArtwork
					testID={`queue-item-${index}`}
					isNested
					editing
				/>
			</Sortable.Touchable>

			<Sortable.Touchable
				onTap={async () => {
					setQueue(queue.filter(({ item }) => item.Id !== queueItem.item.Id))
					await removeFromQueue(index)
				}}
			>
				<Icon name='close' color='$warning' />
			</Sortable.Touchable>
		</XStack>
	)

	const handleReorder = async ({ fromIndex, toIndex }: OrderChangeParams) =>
		await reorderQueue({ fromIndex, toIndex })

	const index = currentIndexFromStore ?? 0
	const rowHeightForInitial = lastMeasuredRowHeight ?? TRACK_ITEM_HEIGHT
	const contentOffset = { x: 0, y: getInitialScrollY(index, windowHeight, rowHeightForInitial) }

	return (
		<Animated.ScrollView
			style={containerStyle}
			contentInsetAdjustmentBehavior='automatic'
			contentOffset={contentOffset}
			ref={scrollableRef}
		>
			<Sortable.Grid
				autoScrollDirection='vertical'
				autoScrollEnabled
				data={queue}
				columns={1}
				keyExtractor={keyExtractor}
				renderItem={renderItem}
				onOrderChange={handleReorder}
				onDragEnd={({ data }) => setQueue(data)}
				overDrag='vertical'
				customHandle
				hapticsEnabled={!reducedHaptics}
				scrollableRef={scrollableRef}
			/>
		</Animated.ScrollView>
	)
}

const containerStyle = {
	flex: 1,
}
