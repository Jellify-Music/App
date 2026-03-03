import { PlayerParamList } from '../../../screens/Player/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Text, useWindowDimensions, View, YStack, ZStack, useTheme, XStack, Spacer } from 'tamagui'
import BlurredBackground from './blurred-background'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useProgress } from '../../../hooks/player/queries'
import { useSeekTo } from '../../../hooks/player/callbacks'
import { UPDATE_INTERVAL } from '../../../configs/player.config'
import React, { useEffect, useMemo, useRef, useCallback, useState } from 'react'
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withSpring,
	interpolateColor,
	withTiming,
	useAnimatedScrollHandler,
	SharedValue,
} from 'react-native-reanimated'
import { FlatList, ListRenderItem } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { trigger } from 'react-native-haptic-feedback'
import Icon from '../../Global/components/icon'
import useRawLyrics from '../../../api/queries/lyrics'
import { useCurrentTrack } from '../../../stores/player/queue'
import Scrubber from './scrubber'
import Controls from './controls'

interface LyricLine {
	Text: string
	Start: number // in 100ns ticks (10,000,000 ticks = 1 second)
}

interface ParsedLyricLine {
	text: string
	startTime: number // in seconds
	index: number
}

const AnimatedText = Animated.createAnimatedComponent(Text)
const AnimatedFlatList = Animated.FlatList<ParsedLyricLine>

// Memoized lyric line component for better performance
const LyricLineItem = React.memo(
	({
		item,
		index,
		currentLineIndex,
		onPress,
		onLayout: onItemLayout,
	}: {
		item: ParsedLyricLine
		index: number
		currentLineIndex: SharedValue<number>
		onPress: (startTime: number, index: number) => void
		onLayout?: (index: number, height: number) => void
	}) => {
		const theme = useTheme()

		// Get theme-aware colors
		const primaryColor = theme.color.val // Primary text color (adapts to dark/light)
		const neutralColor = theme.color.val + '95' // Secondary text color
		const highlightColor = theme.primary.val // Highlight color (primaryDark/primaryLight)
		const translucentColor = theme.translucent?.val // Theme-aware translucent background
		const backgroundHighlight = translucentColor || theme.primary.val + '15' // Fallback with 15% opacity

		const animatedStyle = useAnimatedStyle(() => {
			const isActive = Math.abs(currentLineIndex.value - index) < 0.5
			const isPast = currentLineIndex.value > index
			const distance = Math.abs(currentLineIndex.value - index)

			return {
				opacity: withSpring(isActive ? 1 : distance < 2 ? 0.8 : isPast ? 0.4 : 0.6, {
					damping: 20,
					stiffness: 300,
				}),
				transform: [
					{
						scale: withSpring(isActive ? 1.05 : 1, {
							damping: 20,
							stiffness: 300,
						}),
					},
					{
						translateY: withSpring(isActive ? -4 : 0, {
							damping: 20,
							stiffness: 300,
						}),
					},
				],
			}
		})

		const backgroundStyle = useAnimatedStyle(() => {
			const isActive = Math.abs(currentLineIndex.value - index) < 0.5

			return {
				backgroundColor: interpolateColor(
					isActive ? 1 : 0,
					[0, 1],
					['transparent', backgroundHighlight], // subtle theme-aware glow for active
				),
				borderRadius: withSpring(isActive ? 12 : 8, {
					damping: 20,
					stiffness: 300,
				}),
			}
		})

		const textColorStyle = useAnimatedStyle(() => {
			const isActive = Math.abs(currentLineIndex.value - index) < 0.5
			const isPast = currentLineIndex.value > index

			return {
				color: interpolateColor(
					isActive ? 1 : 0,
					[0, 1],
					[isPast ? neutralColor : primaryColor, highlightColor], // theme-aware colors
				),
				fontWeight: isActive ? '600' : '500',
			}
		})

		const tapGesture = useMemo(
			() =>
				Gesture.Tap()
					.maxDistance(10)
					.maxDuration(500)
					.runOnJS(true)
					.onEnd((_e, success) => {
						if (success) {
							onPress(item.startTime, index)
						}
					}),
			[item.startTime, index, onPress],
		)

		const handleLayout = useCallback(
			(e: { nativeEvent: { layout: { height: number } } }) => {
				onItemLayout?.(index, e.nativeEvent.layout.height)
			},
			[index, onItemLayout],
		)

		return (
			<Animated.View
				onLayout={handleLayout}
				style={[
					{
						paddingVertical: 3,
						paddingHorizontal: 20,
						minHeight: 60,
						justifyContent: 'center',
						marginHorizontal: 16,
						marginVertical: 0,
					},
					animatedStyle,
				]}
			>
				<GestureDetector gesture={tapGesture}>
					<Animated.View
						style={[
							{
								alignSelf: 'stretch',
								minWidth: 0,
								paddingVertical: 10,
								paddingHorizontal: 10,
								borderRadius: 8,
							},
							backgroundStyle,
						]}
					>
						<AnimatedText
							style={[
								{
									fontSize: 18,
									lineHeight: 28,
									textAlign: 'left',
									fontWeight: '500',
								},
								textColorStyle,
							]}
						>
							{item.text}
						</AnimatedText>
					</Animated.View>
				</GestureDetector>
			</Animated.View>
		)
	},
)

LyricLineItem.displayName = 'LyricLineItem'

export default function Lyrics({
	navigation,
}: {
	navigation: NativeStackNavigationProp<PlayerParamList>
}): React.JSX.Element {
	const theme = useTheme()
	const { data: lyrics } = useRawLyrics()
	const nowPlaying = useCurrentTrack()
	const { height } = useWindowDimensions()
	const { position } = useProgress(UPDATE_INTERVAL)
	const seekTo = useSeekTo()

	const flatListRef = useRef<FlatList<ParsedLyricLine>>(null)
	const viewportHeightRef = useRef(height)
	const isInitialMountRef = useRef(true)
	const itemHeightsRef = useRef<Record<number, number>>({})
	const currentLineIndex = useSharedValue(-1)
	const scrollY = useSharedValue(0)
	const isUserScrolling = useSharedValue(false)

	const color = theme.color.val

	const handleFlatListLayout = useCallback(
		(e: { nativeEvent: { layout: { height: number } } }) => {
			viewportHeightRef.current = e.nativeEvent.layout.height
		},
		[],
	)

	// Convert lyrics from ticks to seconds and parse
	const parsedLyrics = useMemo<ParsedLyricLine[]>(() => {
		if (!lyrics) return []

		try {
			const lyricData: LyricLine[] = typeof lyrics === 'string' ? JSON.parse(lyrics) : lyrics
			return lyricData
				.filter((line) => line.Text && line.Text.trim() !== '') // Filter out empty lines
				.map((line, index) => ({
					text: line.Text,
					startTime: line.Start / 10000000, // Convert 100ns ticks to seconds (10,000,000 ticks = 1 second)
					index,
				}))
				.sort((a, b) => a.startTime - b.startTime) // Ensure sorted by time
		} catch (error) {
			console.error('Error parsing lyrics:', error)
			return []
		}
	}, [lyrics])

	const lyricStartTimes = useMemo(
		() => parsedLyrics.map((line) => line.startTime),
		[parsedLyrics],
	)

	// Delay showing "No lyrics available" to avoid flash during track transitions
	const [showNoLyricsMessage, setShowNoLyricsMessage] = useState(false)
	useEffect(() => {
		if (parsedLyrics.length > 0) {
			setShowNoLyricsMessage(false)
			return
		}
		const timer = setTimeout(() => setShowNoLyricsMessage(true), 3000)
		return () => clearTimeout(timer)
	}, [parsedLyrics.length])

	// Track manually selected lyric for immediate feedback
	const manuallySelectedIndex = useSharedValue(-1)
	const manualSelectTimeout = useRef<NodeJS.Timeout | null>(null)

	// Find current lyric line based on playback position
	const currentLyricIndex = useMemo(() => {
		if (position === null || position === undefined || lyricStartTimes.length === 0) return -1

		// Binary search to find the last startTime <= position
		let low = 0
		let high = lyricStartTimes.length - 1
		let found = -1

		while (low <= high) {
			const mid = Math.floor((low + high) / 2)
			if (position >= lyricStartTimes[mid]) {
				found = mid
				low = mid + 1
			} else {
				high = mid - 1
			}
		}

		return found
	}, [position, lyricStartTimes])

	const ESTIMATED_ITEM_HEIGHT = 70
	const CONTENT_PADDING_TOP = height * 0.1

	const pendingScrollOffsetRef = useRef<number | null>(null)

	const getItemHeight = useCallback((index: number) => {
		return itemHeightsRef.current[index] ?? ESTIMATED_ITEM_HEIGHT
	}, [])

	const getItemCenterY = useCallback(
		(index: number) => {
			let offset = CONTENT_PADDING_TOP
			for (let i = 0; i < index; i++) {
				offset += getItemHeight(i)
			}
			return offset + getItemHeight(index) / 2
		},
		[CONTENT_PADDING_TOP, getItemHeight],
	)

	const onItemLayout = useCallback((index: number, itemHeight: number) => {
		itemHeightsRef.current[index] = itemHeight
	}, [])

	// On mount: scroll to center current line. Otherwise: only scroll when current line is within center 75%
	useEffect(() => {
		// Only update if there's no manual selection active
		if (manuallySelectedIndex.value === -1) {
			currentLineIndex.value = withTiming(currentLyricIndex, { duration: 300 })
		}

		if (
			currentLyricIndex < 0 ||
			currentLyricIndex >= parsedLyrics.length ||
			!flatListRef.current ||
			isUserScrolling.value
		) {
			return
		}

		const forceScroll = isInitialMountRef.current
		if (!forceScroll) {
			// Center 75% check: only scroll when current line is within center 75% of viewport
			const viewportHeight = viewportHeightRef.current
			const currentScrollY = scrollY.value
			const center75Top = currentScrollY + viewportHeight * 0.125
			const center75Bottom = currentScrollY + viewportHeight * 0.875
			const currentLineCenter = getItemCenterY(currentLyricIndex)
			const isInCenter75 =
				currentLineCenter >= center75Top && currentLineCenter <= center75Bottom
			if (!isInCenter75) return
		}

		const viewportHeight = viewportHeightRef.current
		const itemCenterY = getItemCenterY(currentLyricIndex)
		const targetOffset = Math.max(0, itemCenterY - viewportHeight / 2)

		const doScroll = () => {
			if (!flatListRef.current) return
			if (forceScroll) isInitialMountRef.current = false
			pendingScrollOffsetRef.current = null
			flatListRef.current.scrollToOffset({
				offset: targetOffset,
				animated: true,
			})
		}

		if (forceScroll) {
			pendingScrollOffsetRef.current = targetOffset
		}

		const scrollTimeout = setTimeout(doScroll, 300)
		return () => clearTimeout(scrollTimeout)
	}, [currentLyricIndex, parsedLyrics.length, height, getItemCenterY])

	// When track changes (next song), scroll to top
	const prevTrackIdRef = useRef<string | undefined>(undefined)
	useEffect(() => {
		const trackId = nowPlaying?.item?.Id
		if (prevTrackIdRef.current !== undefined && prevTrackIdRef.current !== trackId) {
			if (flatListRef.current && parsedLyrics.length) {
				flatListRef.current.scrollToOffset({ offset: 0, animated: false })
			}
			isInitialMountRef.current = true
		}
		prevTrackIdRef.current = trackId
		itemHeightsRef.current = {}
	}, [nowPlaying?.item?.Id, parsedLyrics.length])

	// Reset manual selection when the actual position catches up
	useEffect(() => {
		if (
			manuallySelectedIndex.value !== -1 &&
			currentLyricIndex === manuallySelectedIndex.value
		) {
			manuallySelectedIndex.value = -1
			if (manualSelectTimeout.current) {
				clearTimeout(manualSelectTimeout.current)
				manualSelectTimeout.current = null
			}
		}
	}, [currentLyricIndex])

	// Simple scroll handler
	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			scrollY.value = event.contentOffset.y
		},
		onBeginDrag: () => {
			isUserScrolling.value = true
		},
		onMomentumEnd: () => {
			// Allow auto-scroll again after momentum ends
			isUserScrolling.value = false
		},
	})

	// Reset scrolling state after delay
	useEffect(() => {
		const timer = setTimeout(() => {
			isUserScrolling.value = false
		}, 2000)

		return () => clearTimeout(timer)
	}, [currentLyricIndex])

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (manualSelectTimeout.current) {
				clearTimeout(manualSelectTimeout.current)
			}
		}
	}, [])

	// Find lyric index for a given playback position (same logic as currentLyricIndex)
	const findLyricIndexForPosition = useCallback(
		(pos: number) => {
			if (lyricStartTimes.length === 0) return -1
			let low = 0
			let high = lyricStartTimes.length - 1
			let found = -1
			while (low <= high) {
				const mid = Math.floor((low + high) / 2)
				if (pos >= lyricStartTimes[mid]) {
					found = mid
					low = mid + 1
				} else {
					high = mid - 1
				}
			}
			return found
		},
		[lyricStartTimes],
	)

	// Scroll to specific lyric keeping it centered
	const scrollToLyric = useCallback(
		(lyricIndex: number) => {
			if (flatListRef.current && lyricIndex >= 0 && lyricIndex < parsedLyrics.length) {
				try {
					// Use scrollToIndex with viewPosition 0.5 to center the lyric
					flatListRef.current.scrollToIndex({
						index: lyricIndex,
						animated: true,
						viewPosition: 0.5, // 0.5 = center of visible area
					})
				} catch (error) {
					// Fallback to scrollToOffset if scrollToIndex fails
					console.warn('scrollToIndex failed, using fallback')
					const itemCenterY = getItemCenterY(lyricIndex)
					const targetOffset = Math.max(0, itemCenterY - viewportHeightRef.current / 2)

					flatListRef.current.scrollToOffset({
						offset: targetOffset,
						animated: true,
					})
				}
			}
		},
		[parsedLyrics.length, height, getItemCenterY],
	)

	// Handle seeking to specific lyric timestamp
	const handleLyricPress = useCallback(
		(startTime: number, lyricIndex: number) => {
			trigger('impactMedium') // Haptic feedback for seek action

			// Immediately update the highlighting for instant feedback
			manuallySelectedIndex.value = lyricIndex
			currentLineIndex.value = withTiming(lyricIndex, { duration: 200 })

			// Scroll to ensure the selected lyric is visible
			scrollToLyric(lyricIndex)

			// Clear any existing timeout
			if (manualSelectTimeout.current) {
				clearTimeout(manualSelectTimeout.current)
			}

			// Set a fallback timeout in case the position doesn't catch up
			manualSelectTimeout.current = setTimeout(() => {
				manuallySelectedIndex.value = -1
			}, 3000)

			seekTo(startTime)
			// Temporarily disable auto-scroll when user manually seeks
			isUserScrolling.value = true
			setTimeout(() => {
				isUserScrolling.value = false
			}, 1000)
		},
		[seekTo, scrollToLyric],
	)

	// Handle back navigation
	const handleBackPress = useCallback(
		(triggerHaptic: boolean | undefined = true) => {
			if (triggerHaptic) trigger('impactLight') // Haptic feedback for navigation
			navigation.goBack()
		},
		[navigation],
	)

	// Optimized render item for FlatList
	const renderLyricItem: ListRenderItem<ParsedLyricLine> = useCallback(
		({ item, index }) => {
			return (
				<LyricLineItem
					item={item}
					index={index}
					onLayout={onItemLayout}
					currentLineIndex={currentLineIndex}
					onPress={handleLyricPress}
				/>
			)
		},
		[currentLineIndex, handleLyricPress, onItemLayout],
	)

	const contentPaddingTop = height * 0.1

	const getItemOffset = useCallback(
		(index: number) => {
			let offset = contentPaddingTop
			for (let i = 0; i < index; i++) {
				offset += getItemHeight(i)
			}
			return offset
		},
		[contentPaddingTop, getItemHeight],
	)

	const getItemLayout = useCallback(
		(_: unknown, index: number) => ({
			length: getItemHeight(index),
			offset: getItemOffset(index),
			index,
		}),
		[getItemHeight, getItemOffset],
	)

	const handleContentSizeChange = useCallback((_w: number, contentHeight: number) => {
		const pending = pendingScrollOffsetRef.current
		const viewportHeight = viewportHeightRef.current
		// Content must be tall enough to scroll to target (max offset = contentHeight - viewportHeight)
		if (pending !== null && flatListRef.current && contentHeight >= pending + viewportHeight) {
			pendingScrollOffsetRef.current = null
			isInitialMountRef.current = false
			flatListRef.current.scrollToOffset({
				offset: pending,
				animated: true,
			})
		}
	}, [])

	const keyExtractor = useCallback(
		(item: ParsedLyricLine, index: number) => `lyric-${index}-${item.startTime}`,
		[],
	)

	const blockSwipeGesture = Gesture.Pan().minDistance(0)

	return (
		<SafeAreaView style={{ flex: 1 }} edges={['top']}>
			<View flex={1}>
				<ZStack fullscreen>
					<BlurredBackground />

					<YStack fullscreen>
						<XStack
							alignItems='center'
							justifyContent='space-between'
							paddingHorizontal='$4'
							paddingVertical='$2'
							marginTop='$2'
						>
							<XStack
								alignItems='center'
								onPress={() => handleBackPress()}
								hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
							>
								<Icon small name='chevron-left' />
							</XStack>
							<YStack>
								<Text
									fontSize={16}
									fontWeight='bold'
									color={color}
									textAlign='center'
								>
									{nowPlaying?.item?.Name}
								</Text>
								<Text fontSize={14} color={color} textAlign='center'>
									{nowPlaying?.item?.ArtistItems?.map(
										(artist) => artist.Name,
									).join(', ')}
								</Text>
							</YStack>
							<Spacer width={28} /> {/* Balance the layout */}
						</XStack>

						{parsedLyrics.length > 0 ? (
							<AnimatedFlatList
								ref={flatListRef}
								data={parsedLyrics}
								renderItem={renderLyricItem}
								keyExtractor={keyExtractor}
								getItemLayout={getItemLayout}
								onLayout={handleFlatListLayout}
								onContentSizeChange={handleContentSizeChange}
								onScroll={scrollHandler}
								scrollEventThrottle={16}
								showsVerticalScrollIndicator={false}
								contentContainerStyle={{
									paddingTop: height * 0.1,
									paddingBottom: height * 0.5 + 100, // Extra for miniplayer overlay
								}}
								style={{ flex: 1 }}
								removeClippedSubviews={false}
								maxToRenderPerBatch={15}
								windowSize={15}
								initialNumToRender={15}
								onScrollToIndexFailed={(error) => {
									console.warn('ScrollToIndex failed:', error)
									// Fallback to scrollToOffset
									if (flatListRef.current) {
										const itemCenterY = getItemCenterY(error.index)
										const targetOffset = Math.max(
											0,
											itemCenterY - viewportHeightRef.current / 2,
										)
										flatListRef.current.scrollToOffset({
											offset: targetOffset,
											animated: true,
										})
									}
								}}
							/>
						) : (
							<YStack justifyContent='center' alignItems='center' flex={1}>
								{showNoLyricsMessage && (
									<Text fontSize={18} color='$color' textAlign='center'>
										No lyrics available
									</Text>
								)}
							</YStack>
						)}
						<GestureDetector gesture={blockSwipeGesture}>
							<YStack
								justifyContent='flex-start'
								gap={'$3'}
								flexShrink={1}
								padding='$5'
								paddingBottom='$7'
							>
								<Scrubber
									onSeekComplete={(position) => {
										const index = findLyricIndexForPosition(position)
										if (index >= 0) {
											currentLineIndex.value = withTiming(index, {
												duration: 200,
											})
											scrollToLyric(index)
										}
									}}
								/>
								<Controls onLyricsScreen />
							</YStack>
						</GestureDetector>
					</YStack>
				</ZStack>
			</View>
		</SafeAreaView>
	)
}
