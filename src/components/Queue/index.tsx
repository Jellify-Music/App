import Icon from '../Global/components/icon'
import Track from '../Global/components/Track'
import { RootStackParamList } from '../../screens/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Text, XStack } from 'tamagui'
import { useLayoutEffect, useRef, useState, useEffect, useCallback } from 'react'
import { LayoutChangeEvent, useWindowDimensions } from 'react-native'
import { useRoute } from '@react-navigation/native'
import JellifyTrack from '../../types/JellifyTrack'
import {
	useRemoveFromQueue,
	useRemoveUpcomingTracks,
	useReorderQueue,
	useSkip,
	useClearHomeQueue,
} from '../../hooks/player/callbacks'
import { useCurrentIndex, useQueueRef, usePlayQueue } from '../../stores/player/queue'
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
	const playQueue = usePlayQueue()
	const [queue, setQueue] = useState<JellifyTrack[]>(playQueue)

	// Sync local queue state when the reactive store queue updates (e.g. items added)
	useEffect(() => {
		setQueue(playQueue)
	}, [playQueue])

	const currentIndexFromStore = useCurrentIndex()

	const queueRef = useQueueRef()
	const removeUpcomingTracks = useRemoveUpcomingTracks()
	const removeFromQueue = useRemoveFromQueue()
	const reorderQueue = useReorderQueue()
	const skip = useSkip()
	const clearHomeQueue = useClearHomeQueue()

	const scrollableRef = useAnimatedRef<Animated.ScrollView>()

	// Track last known scroll position so we can test if the playing item
	// is already inside the center third of the viewport before scrolling.
	const lastScrollYRef = useRef<number>(0)

	const ensurePlayingTrackInCenterThird = useCallback(
		async (indexOverride?: number) => {
			const idxFromStore = currentIndexFromStore
			let targetIndex = indexOverride ?? idxFromStore ?? 0

			// If TrackPlayer knows the active index, prefer that (handles external changes)
			try {
				const active = await TrackPlayer.getActiveTrackIndex()
				if (typeof active === 'number' && !isNaN(active)) targetIndex = active
			} catch (e) {
				// ignore
			}

			if (targetIndex === undefined || targetIndex === null) return

			let attempts = 0
			const maxAttempts = 3

			const tryScroll = () => {
				const rowHeight = rowHeightRef.current ?? lastMeasuredRowHeight ?? TRACK_ITEM_HEIGHT
				const itemTop = targetIndex * rowHeight
				const itemCenter = itemTop + rowHeight / 2
				const viewportTop = lastScrollYRef.current
				const viewportCenterThirdTop = viewportTop + windowHeight / 3
				const viewportCenterThirdBottom = viewportTop + (2 * windowHeight) / 3

				// If item center already within center third, nothing to do
				if (
					itemCenter >= viewportCenterThirdTop &&
					itemCenter <= viewportCenterThirdBottom
				) {
					return
				}

				// Otherwise compute a targetY that centers the item
				const targetY = Math.max(0, Math.floor(itemCenter - windowHeight / 2))
				const snapOffset = Math.min(120, Math.floor(windowHeight / 6))
				const snapY = Math.max(0, targetY - snapOffset)

				try {
					// quick snap near the final position
					scrollableRef.current?.scrollTo({ y: snapY, animated: false })
					// then smooth to the exact target shortly after
					setTimeout(() => {
						try {
							scrollableRef.current?.scrollTo({ y: targetY, animated: true })
						} catch (e) {
							// ignore
						}
					}, 30)
				} catch (e) {
					// ignore
				}

				attempts += 1
				if (attempts < maxAttempts) setTimeout(tryScroll, 50)
			}

			// Start quickly after layout changes
			setTimeout(tryScroll, 20)
		},
		[currentIndexFromStore, windowHeight],
	)

	const [reducedHaptics] = useReducedHapticsSetting()
	const { height: windowHeight } = useWindowDimensions()
	const hasScrolledToCurrentRef = useRef(false)
	const rowHeightRef = useRef<number | null>(null)

	// Ensure playing track is centered when the current index changes (new track begins)
	useEffect(() => {
		// fire-and-forget (ensurePlayingTrack handles retries)
		ensurePlayingTrackInCenterThird().catch(() => {})
	}, [currentIndexFromStore, ensurePlayingTrackInCenterThird])

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

	const route = useRoute()

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => {
				return (
					<XStack gap='$2'>
						<Text color={'$warning'} marginVertical={'auto'} fontWeight={'bold'}>
							Clear
						</Text>
						<Icon
							name='broom'
							color='$warning'
							onPress={async () => {
								const params = route.params as { homeQueue?: boolean } | undefined
								if (params?.homeQueue) {
									await clearHomeQueue()
								} else {
									await removeUpcomingTracks()
								}
								setQueue((await TrackPlayer.getQueue()) as JellifyTrack[])
								// After clearing, ensure the playing track is visible in the center third
								try {
									await ensurePlayingTrackInCenterThird()
								} catch (e) {
									// ignore
								}
							}}
						/>
					</XStack>
				)
			},
		})
	}, [
		navigation,
		removeUpcomingTracks,
		clearHomeQueue,
		route.params,
		ensurePlayingTrackInCenterThird,
	])

	const keyExtractor = (item: JellifyTrack) => `${item.item.Id}`

	// Memoize renderItem function for better performance
	const renderItem = ({ item: queueItem, index }: RenderItemInfo<JellifyTrack>) => (
		<XStack alignItems='center' onLayout={index === 0 ? handleFirstRowLayout : undefined}>
			<Sortable.Handle style={{ display: 'flex', flexShrink: 1 }}>
				<Icon name='drag' />
			</Sortable.Handle>

			<Sortable.Touchable
				onTap={async () => {
					await skip(index)

					// After skipping, ensure the selected item is within the center third
					try {
						await ensurePlayingTrackInCenterThird(index)
					} catch (e) {
						// ignore
					}
				}}
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
			onScroll={(e) => {
				lastScrollYRef.current = e.nativeEvent.contentOffset.y
			}}
			scrollEventThrottle={16}
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
