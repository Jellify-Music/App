import { SizableText, View, YStack, getTokenValue } from 'tamagui'
import { useShowNoLyricsMessage } from '../../hooks/lyrics/parsing'
import { useProgress } from '../../player'
import React, { useEffect, useRef } from 'react'
import { useSharedValue, withTiming, withSpring } from 'react-native-reanimated'
import useRawLyrics from '../../api/queries/lyrics'
import { useCurrentTrack } from '../../stores/player/queue'
import seekTo from '../../player/controls/seek'
import { applyHapticFeedback } from '../../utils/haptics'
import { isEmpty } from 'lodash'
import { ParsedLyricLine } from '../../types/Lyrics'
import LyricLineItem from './components/line-item'
import { useResetScroll } from '../../hooks/lyrics/scrolling'
import { LegendListRef, LegendListRenderItemProps } from '@legendapp/list/react-native'
import { AnimatedLegendList } from '@legendapp/list/reanimated'
import { LyricKeyExtractor } from '../../utils/parsing/key-extractor'

const LyricList = AnimatedLegendList<ParsedLyricLine>

export default function Lyrics(): React.JSX.Element {
	const { data: lyrics } = useRawLyrics()
	const nowPlaying = useCurrentTrack()
	const { position } = useProgress()

	const lyricsListRef = useRef<LegendListRef>(null)
	const isInitialMountRef = useRef(true)
	const currentLineIndex = useSharedValue(-1)
	const isUserScrolling = useSharedValue(false)

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

	// Keep the current line centered. LegendList measures items itself, so let it
	// compute the offset rather than estimating item heights here.
	useEffect(() => {
		// Only update if there's no manual selection active
		if (manuallySelectedIndex.value === -1) {
			currentLineIndex.value = withSpring(currentLyricIndex)
		}

		if (!lyricsListRef.current) return

		if (isInitialMountRef.current) {
			isInitialMountRef.current = false
			return
		}

		if (
			currentLyricIndex < 0 ||
			currentLyricIndex >= parsedLyrics.length ||
			isUserScrolling.value
		) {
			return
		}

		lyricsListRef.current.scrollToIndex({
			index: currentLyricIndex,
			animated: true,
			viewPosition: 0.5,
		})
	}, [currentLyricIndex, parsedLyrics.length])

	// When track changes (next song), scroll to top
	const prevTrackIdRef = useRef<string | undefined>(undefined)
	useEffect(() => {
		const trackId = nowPlaying?.id
		if (prevTrackIdRef.current !== undefined && prevTrackIdRef.current !== trackId) {
			if (lyricsListRef.current && parsedLyrics.length) {
				lyricsListRef.current.scrollToOffset({ offset: 0, animated: false })
			}
			isInitialMountRef.current = true
		}
		prevTrackIdRef.current = trackId
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

	// Pause auto-scroll while the user is dragging the list
	const handleScrollBeginDrag = () => {
		isUserScrolling.value = true
	}

	// Allow auto-scroll again after momentum ends
	const handleMomentumScrollEnd = () => {
		isUserScrolling.value = false
	}

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
		if (lyricsListRef.current && lyricIndex >= 0 && lyricIndex < parsedLyrics.length) {
			lyricsListRef.current.scrollToIndex({
				index: lyricIndex,
				animated: true,
				viewPosition: 0.5, // 0.5 = center of visible area
			})
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
	const renderLyricItem = ({
		item,
		index,
	}: LegendListRenderItemProps<ParsedLyricLine, string | undefined>) => {
		return (
			<LyricLineItem
				item={item}
				index={index}
				currentLineIndex={currentLineIndex}
				onPress={handleLyricPress}
			/>
		)
	}

	return (
		<View flex={1}>
			{parsedLyrics.length > 0 ? (
				<LyricList
					ref={lyricsListRef}
					data={parsedLyrics}
					renderItem={renderLyricItem}
					keyExtractor={LyricKeyExtractor}
					initialScrollIndex={
						currentLyricIndex >= 0
							? { index: currentLyricIndex, viewPosition: 0.5 }
							: undefined
					}
					onScrollBeginDrag={handleScrollBeginDrag}
					onMomentumScrollEnd={handleMomentumScrollEnd}
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{
						margin: getTokenValue('4'),
					}}
				/>
			) : (
				<YStack justifyContent='center' alignItems='center' flex={1}>
					{showNoLyricsMessage && (
						<SizableText fontSize={'3'} textAlign='center'>
							No lyrics available
						</SizableText>
					)}
				</YStack>
			)}
		</View>
	)
}
