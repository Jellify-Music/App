import React, { useMemo, useRef, useCallback, useEffect } from 'react'
import { View, Dimensions, FlatList, ListRenderItem } from 'react-native'
import { Text, YStack, useTheme } from 'tamagui'
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withSpring,
	interpolateColor,
	withTiming,
	useAnimatedScrollHandler,
	runOnJS,
} from 'react-native-reanimated'
import { trigger } from 'react-native-haptic-feedback'
import useRawLyrics from '../../../api/queries/lyrics'
import { useProgress } from '../../../providers/Player/hooks/queries'
import { useSeekTo } from '../../../providers/Player/hooks/mutations'
import { UPDATE_INTERVAL } from '../../../player/config'

interface LyricLine {
	Text: string
	Start: number
}

interface ParsedLyricLine {
	text: string
	startTime: number
	index: number
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')
const cardSize = Math.min(screenWidth * 0.9, 420)
const lyricsHeight = Math.min(screenHeight * 0.55, 420)

const AnimatedText = Animated.createAnimatedComponent(Text)
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<ParsedLyricLine>)

// Memoized lyric line component for better performance
const LyricLineItem = React.memo(
	({
		item,
		index,
		currentLineIndex,
		onPress,
		themeColors,
	}: {
		item: ParsedLyricLine
		index: number
		currentLineIndex: Animated.SharedValue<number>
		onPress: (startTime: number, index: number) => void
		themeColors: {
			primaryColor: string
			neutralColor: string
			highlightColor: string
			backgroundHighlight: string
		}
	}) => {
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
				backgroundColor: interpolateColor(
					isActive ? 1 : 0,
					[0, 1],
					['transparent', themeColors.backgroundHighlight],
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
					[
						isPast ? themeColors.neutralColor : themeColors.primaryColor,
						themeColors.highlightColor,
					],
				),
				fontWeight: isActive ? '600' : '500',
			}
		})

		const handlePress = useCallback(() => {
			onPress(item.startTime, index)
		}, [item.startTime, index, onPress])

		return (
			<Animated.View
				style={[
					{
						paddingVertical: 10,
						paddingHorizontal: 20,
						minHeight: 64,
						justifyContent: 'center',
						marginHorizontal: 8,
						marginVertical: 2,
					},
					animatedStyle,
				]}
				onTouchEnd={handlePress}
			>
				<AnimatedText
					style={[
						{
							fontSize: 18,
							lineHeight: 28,
							textAlign: 'center',
							fontWeight: '500',
							paddingVertical: 6,
							paddingHorizontal: 14,
						},
						textColorStyle,
					]}
				>
					{item.text}
				</AnimatedText>
			</Animated.View>
		)
	},
)

LyricLineItem.displayName = 'LyricLineItem'

export default function InlineLyrics(): React.JSX.Element {
	const theme = useTheme()
	const { data: lyrics } = useRawLyrics()
	const { position } = useProgress(UPDATE_INTERVAL)
	const { mutate: seekTo } = useSeekTo()

	const themeColors = useMemo(() => {
		const primaryColor = theme.color.val
		const neutralColor = theme.neutral.val
		const highlightColor = theme.primary.val
		const translucentColor = theme.translucent?.val
		const backgroundHighlight = translucentColor || theme.primary.val + '15'

		return {
			primaryColor,
			neutralColor,
			highlightColor,
			backgroundHighlight,
		}
	}, [theme.color.val, theme.neutral.val, theme.primary.val, theme.translucent?.val])

	const flatListRef = useRef<FlatList<ParsedLyricLine>>(null)
	const currentLineIndex = useSharedValue(-1)
	const scrollY = useSharedValue(0)
	const isUserScrolling = useSharedValue(false)

	const parsedLyrics = useMemo<ParsedLyricLine[]>(() => {
		if (!lyrics) return []
		try {
			const lyricData: LyricLine[] = typeof lyrics === 'string' ? JSON.parse(lyrics) : lyrics
			return lyricData
				.filter((line) => line.Text && line.Text.trim() !== '')
				.map((line, index) => ({
					text: line.Text,
					startTime: line.Start / 10000000,
					index,
				}))
				.sort((a, b) => a.startTime - b.startTime)
		} catch (error) {
			console.error('Error parsing lyrics:', error)
			return []
		}
	}, [lyrics])

	const manuallySelectedIndex = useSharedValue(-1)
	const manualSelectTimeout = useRef<NodeJS.Timeout | null>(null)

	const currentLyricIndex = useMemo(() => {
		if (!position || parsedLyrics.length === 0) return -1
		for (let i = parsedLyrics.length - 1; i >= 0; i--) {
			if (position >= parsedLyrics[i].startTime) {
				return i
			}
		}
		return -1
	}, [position, parsedLyrics])

	const scrollToCurrentLyric = useCallback(() => {
		if (
			currentLyricIndex >= 0 &&
			currentLyricIndex < parsedLyrics.length &&
			flatListRef.current &&
			!isUserScrolling.value
		) {
			try {
				flatListRef.current.scrollToIndex({
					index: currentLyricIndex,
					animated: true,
					viewPosition: 0.5,
				})
			} catch (error) {
				console.warn('scrollToIndex failed, using fallback')
				const estimatedItemHeight = 60
				const targetOffset = Math.max(
					0,
					currentLyricIndex * estimatedItemHeight - lyricsHeight * 0.4,
				)

				flatListRef.current.scrollToOffset({
					offset: targetOffset,
					animated: true,
				})
			}
		}
	}, [currentLyricIndex, parsedLyrics.length, lyricsHeight, isUserScrolling])

	useEffect(() => {
		if (manuallySelectedIndex.value === -1) {
			currentLineIndex.value = withTiming(currentLyricIndex, { duration: 300 })
		}

		const scrollTimeout = setTimeout(scrollToCurrentLyric, 100)
		return () => clearTimeout(scrollTimeout)
	}, [currentLyricIndex, scrollToCurrentLyric])

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

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			scrollY.value = event.contentOffset.y
		},
		onBeginDrag: () => {
			isUserScrolling.value = true
		},
		onMomentumEnd: () => {
			isUserScrolling.value = false
		},
	})

	useEffect(() => {
		const timer = setTimeout(() => {
			isUserScrolling.value = false
		}, 2000)

		return () => clearTimeout(timer)
	}, [currentLyricIndex])

	useEffect(() => {
		return () => {
			if (manualSelectTimeout.current) {
				clearTimeout(manualSelectTimeout.current)
			}
		}
	}, [])

	const scrollToLyric = useCallback(
		(lyricIndex: number) => {
			if (flatListRef.current && lyricIndex >= 0 && lyricIndex < parsedLyrics.length) {
				try {
					flatListRef.current.scrollToIndex({
						index: lyricIndex,
						animated: true,
						viewPosition: 0.5,
					})
				} catch (error) {
					console.warn('scrollToIndex failed, using fallback')
					const estimatedItemHeight = 60
					const targetOffset = Math.max(
						0,
						lyricIndex * estimatedItemHeight - lyricsHeight * 0.4,
					)

					flatListRef.current.scrollToOffset({
						offset: targetOffset,
						animated: true,
					})
				}
			}
		},
		[parsedLyrics.length, lyricsHeight],
	)

	const handleLyricPress = useCallback(
		(startTime: number, lyricIndex: number) => {
			console.log('Seeking to:', startTime)
			trigger('impactMedium')

			manuallySelectedIndex.value = lyricIndex
			currentLineIndex.value = withTiming(lyricIndex, { duration: 200 })

			scrollToLyric(lyricIndex)

			if (manualSelectTimeout.current) {
				clearTimeout(manualSelectTimeout.current)
			}

			manualSelectTimeout.current = setTimeout(() => {
				manuallySelectedIndex.value = -1
			}, 3000)

			seekTo(startTime)
			isUserScrolling.value = true
			setTimeout(() => {
				isUserScrolling.value = false
			}, 1000)
		},
		[seekTo, scrollToLyric],
	)

	const renderLyricItem: ListRenderItem<ParsedLyricLine> = useCallback(
		({ item, index }) => {
			return (
				<LyricLineItem
					item={item}
					index={index}
					currentLineIndex={currentLineIndex}
					onPress={handleLyricPress}
					themeColors={themeColors}
				/>
			)
		},
		[currentLineIndex, handleLyricPress, themeColors],
	)

	const keyExtractor = useCallback(
		(item: ParsedLyricLine, index: number) => `lyric-${index}-${item.startTime}`,
		[],
	)

	if (!parsedLyrics.length) {
		return (
			<View
				style={{
					width: cardSize,
					height: lyricsHeight,
					justifyContent: 'center',
					alignItems: 'center',
				}}
			>
				<Text fontSize={16} color={theme.neutral.val} textAlign='center' opacity={0.7}>
					No lyrics available
				</Text>
			</View>
		)
	}

	return (
		<View
			style={{
				width: cardSize,
				height: lyricsHeight,
				borderRadius: 20,
				overflow: 'hidden',
			}}
		>
			<AnimatedFlatList
				ref={flatListRef}
				data={parsedLyrics}
				renderItem={renderLyricItem}
				keyExtractor={keyExtractor}
				onScroll={scrollHandler}
				scrollEventThrottle={16}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					paddingTop: lyricsHeight * 0.2,
					paddingBottom: lyricsHeight * 0.2,
				}}
				style={{ flex: 1 }}
				removeClippedSubviews={false}
				maxToRenderPerBatch={10}
				windowSize={10}
				initialNumToRender={10}
				updateCellsBatchingPeriod={50}
				onScrollToIndexFailed={(error) => {
					console.warn('ScrollToIndex failed:', error)
					if (flatListRef.current) {
						const targetOffset = Math.max(
							0,
							error.index * 60 - lyricsHeight * 0.4,
						)
						flatListRef.current.scrollToOffset({
							offset: targetOffset,
							animated: true,
						})
					}
				}}
			/>
		</View>
	)
}


