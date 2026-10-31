import { Text, useWindowDimensions, View, YStack } from 'tamagui'
import { useShowNoLyricsMessage } from '../../hooks/lyrics/parsing'
import { useProgress } from '../../player'
import React, { useEffect, useRef, useState } from 'react'
import Animated, {
	useSharedValue,
	withTiming,
	useAnimatedScrollHandler,
	FadeIn,
	Easing,
	FadeOut,
} from 'react-native-reanimated'
import { FlatList, ListRenderItem } from 'react-native'
import useRawLyrics from '../../api/queries/lyrics'
import { useCurrentTrack } from '../../stores/player/queue'
import seekTo from '../../player/controls/seek'
import { applyHapticFeedback } from '../../utils/haptics'
import { isEmpty } from 'lodash'
import { ParsedLyricLine } from '../../types/Lyrics'
import LyricLineItem from './components/line-item'
import { useResetScroll } from '../../hooks/lyrics/scrolling'

const AnimatedFlatList = Animated.FlatList<ParsedLyricLine>

export default function Lyrics(): React.JSX.Element {
	const { data: lyrics } = useRawLyrics()
	const nowPlaying = useCurrentTrack()
	const { height } = useWindowDimensions()
	const { position } = useProgress()

	const flatListRef = useRef<FlatList<ParsedLyricLine>>(null)
	const viewportHeightRef = useRef(height)
	const isInitialMountRef = useRef(true)
	const itemHeightsRef = useRef<Record<number, number>>({})
	const currentLineIndex = useSharedValue(-1)
	const scrollY = useSharedValue(0)
	const isUserScrolling = useSharedValue(false)

	const handleFlatListLayout = (e: { nativeEvent: { layout: { height: number } } }) => {
		viewportHeightRef.current = e.nativeEvent.layout.height
	}

	// Convert lyrics from ticks to seconds and parse
	const parsedLyrics: ParsedLyricLine[] = !lyrics
		? []
		: lyrics
				.filter(({ Text }) => !isEmpty(Text)) // Filter out empty lines
				.map(({ Text, Start }, index) => ({
					text: Text!,
					startTime: Start! / 10000000, // Convert 100ns ticks to seconds (10,000,000 ticks = 1 second)
					index,
				}))
				.sort((a, b) => a.startTime - b.startTime) // Ensure sorted by time

	const lyricStartTimes = parsedLyrics.map((line) => line.startTime)

	// Delay showing "No lyrics available" to avoid flash during track transitions
	const showNoLyricsMessage = useShowNoLyricsMessage(parsedLyrics)

	// Track manually selected lyric for immediate feedback
	const manuallySelectedIndex = useSharedValue(-1)
	const manualSelectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

	// Find current lyric line based on playback position
	const currentLyricIndex =
		position === null || position === undefined || lyricStartTimes.length === 0
			? -1
			: (() => {
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
				})()

	const ESTIMATED_ITEM_HEIGHT = 70
	const CONTENT_PADDING_TOP = height * 0.1

	const pendingScrollOffsetRef = useRef<number | null>(null)

	const getItemHeight = (index: number) => {
		return itemHeightsRef.current[index] ?? ESTIMATED_ITEM_HEIGHT
	}

	const getItemCenterY = (index: number) => {
		let offset = CONTENT_PADDING_TOP
		for (let i = 0; i < index; i++) {
			offset += getItemHeight(i)
		}
		return offset + getItemHeight(index) / 2
	}

	const onItemLayout = (index: number, itemHeight: number) => {
		itemHeightsRef.current[index] = itemHeight
	}

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
	}, [currentLyricIndex, parsedLyrics.length, height])

	// When track changes (next song), scroll to top
	const prevTrackIdRef = useRef<string | undefined>(undefined)
	useEffect(() => {
		const trackId = nowPlaying?.id
		if (prevTrackIdRef.current !== undefined && prevTrackIdRef.current !== trackId) {
			if (flatListRef.current && parsedLyrics.length) {
				flatListRef.current.scrollToOffset({ offset: 0, animated: false })
			}
			isInitialMountRef.current = true
		}
		prevTrackIdRef.current = trackId
		itemHeightsRef.current = {}
	}, [nowPlaying?.id, parsedLyrics.length])

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

	useResetScroll({ currentLyricIndex, isUserScrolling })

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (manualSelectTimeout.current) {
				clearTimeout(manualSelectTimeout.current)
			}
		}
	}, [])

	// Scroll to specific lyric keeping it centered
	const scrollToLyric = (lyricIndex: number) => {
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
	}

	// Handle seeking to specific lyric timestamp
	const handleLyricPress = (startTime: number, lyricIndex: number) => {
		applyHapticFeedback('info') // Haptic feedback for seek action

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
	}

	// Optimized render item for FlatList
	const renderLyricItem: ListRenderItem<ParsedLyricLine> = ({ item, index }) => {
		return (
			<LyricLineItem
				item={item}
				index={index}
				onLayout={onItemLayout}
				currentLineIndex={currentLineIndex}
				onPress={handleLyricPress}
			/>
		)
	}

	const contentPaddingTop = height * 0.1

	const getItemOffset = (index: number) => {
		let offset = contentPaddingTop
		for (let i = 0; i < index; i++) {
			offset += getItemHeight(i)
		}
		return offset
	}

	const getItemLayout = (_: unknown, index: number) => ({
		length: getItemHeight(index),
		offset: getItemOffset(index),
		index,
	})

	const handleContentSizeChange = (_w: number, contentHeight: number) => {
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
	}

	const keyExtractor = (item: ParsedLyricLine, index: number) =>
		`lyric-${index}-${item.startTime}`

	return (
		<View flex={1}>
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
					removeClippedSubviews={false}
					maxToRenderPerBatch={15}
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
					entering={FadeIn.easing(Easing.in(Easing.ease))}
					exiting={FadeOut.easing(Easing.out(Easing.ease))}
				/>
			) : (
				<YStack justifyContent='center' alignItems='center' flex={1}>
					{showNoLyricsMessage && (
						<Text fontSize={'3'} textAlign='center'>
							No lyrics available
						</Text>
					)}
				</YStack>
			)}
		</View>
	)
}
