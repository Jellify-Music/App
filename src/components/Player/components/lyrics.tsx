import { RouteProp, useRoute } from '@react-navigation/native'
import { PlayerParamList } from '../../../screens/Player/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Text, useWindowDimensions, View, YStack, ZStack, useTheme, XStack, Spacer } from 'tamagui'
import BlurredBackground from './blurred-background'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useProgress } from '../../../providers/Player/hooks/queries'
import { useSeekTo } from '../../../providers/Player/hooks/mutations'
import { UPDATE_INTERVAL } from '../../../player/config'
import React, { useEffect, useMemo, useRef, useCallback } from 'react'
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withSpring,
	interpolateColor,
	withTiming,
	useAnimatedScrollHandler,
	runOnJS,
} from 'react-native-reanimated'
import { FlatList, ListRenderItem, Platform } from 'react-native'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import { trigger } from 'react-native-haptic-feedback'

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
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<ParsedLyricLine>)

// Memoized lyric line component for better performance
const LyricLineItem = React.memo(
	({
		item,
		index,
		currentLineIndex,
		onPress,
	}: {
		item: ParsedLyricLine
		index: number
		currentLineIndex: Animated.SharedValue<number>
		onPress: (startTime: number, index: number) => void
	}) => {
		const theme = useTheme()

		// Get theme-aware colors
		const primaryColor = theme.color.val // Primary text color (adapts to dark/light)
		const neutralColor = theme.neutral.val // Secondary text color
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

		const handlePress = useCallback(() => {
			onPress(item.startTime, index)
		}, [item.startTime, index, onPress])

		return (
			<Animated.View
				style={[
					{
						paddingVertical: 12,
						paddingHorizontal: 20,
						minHeight: 60,
						justifyContent: 'center',
						marginHorizontal: 16,
						marginVertical: 4,
					},
					animatedStyle,
				]}
			>
				<Animated.View
					style={[
						{
							paddingVertical: 8,
							paddingHorizontal: 16,
							borderRadius: 8,
						},
						backgroundStyle,
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
							},
							textColorStyle,
						]}
					>
						{item.text}
					</AnimatedText>
				</Animated.View>
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
	const route = useRoute<RouteProp<PlayerParamList, 'LyricsScreen'>>()
	const { lyrics } = route.params
	const { width, height } = useWindowDimensions()
	const { position } = useProgress(UPDATE_INTERVAL)
	const { mutate: seekTo } = useSeekTo()
	const theme = useTheme()

	const flatListRef = useRef<FlatList<ParsedLyricLine>>(null)
	const currentLineIndex = useSharedValue(-1)
	const scrollY = useSharedValue(0)
	const isUserScrolling = useSharedValue(false)

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

	// Track manually selected lyric for immediate feedback
	const manuallySelectedIndex = useSharedValue(-1)
	const manualSelectTimeout = useRef<NodeJS.Timeout | null>(null)

	// Find current lyric line based on playback position
	const currentLyricIndex = useMemo(() => {
		if (!position || parsedLyrics.length === 0) return -1

		// Find the last lyric that has started
		for (let i = parsedLyrics.length - 1; i >= 0; i--) {
			if (position >= parsedLyrics[i].startTime) {
				return i
			}
		}
		return -1
	}, [position, parsedLyrics])

	// Auto-scroll to current lyric with smooth animation
	const scrollToCurrentLyric = useCallback(() => {
		if (
			currentLyricIndex >= 0 &&
			currentLyricIndex < parsedLyrics.length &&
			flatListRef.current &&
			!isUserScrolling.value
		) {
			// Use scrollToOffset instead of scrollToIndex for better reliability
			const estimatedItemHeight = 80
			const targetOffset = Math.max(0, currentLyricIndex * estimatedItemHeight - height * 0.2)

			flatListRef.current.scrollToOffset({
				offset: targetOffset,
				animated: true,
			})
		}
	}, [currentLyricIndex, parsedLyrics.length, height])

	useEffect(() => {
		// Only update if there's no manual selection active
		if (manuallySelectedIndex.value === -1) {
			currentLineIndex.value = withTiming(currentLyricIndex, { duration: 300 })
		}

		// Delay scroll to allow for smooth animation
		const scrollTimeout = setTimeout(scrollToCurrentLyric, 100)
		return () => clearTimeout(scrollTimeout)
	}, [currentLyricIndex, scrollToCurrentLyric])

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

	// Handle scroll events with simpler approach
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

	// Additional fallback to reset scrolling state
	useEffect(() => {
		const timer = setTimeout(() => {
			isUserScrolling.value = false
		}, 3000)

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

	// Handle seeking to specific lyric timestamp
	const handleLyricPress = useCallback(
		(startTime: number, lyricIndex: number) => {
			console.log('Seeking to:', startTime)
			trigger('impactMedium') // Haptic feedback for seek action

			// Immediately update the highlighting for instant feedback
			manuallySelectedIndex.value = lyricIndex
			currentLineIndex.value = withTiming(lyricIndex, { duration: 200 })

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
		[seekTo],
	)

	// Handle back navigation
	const handleBackPress = useCallback(() => {
		trigger('impactLight') // Haptic feedback for navigation
		navigation.goBack()
	}, [navigation])

	// Optimized render item for FlatList
	const renderLyricItem: ListRenderItem<ParsedLyricLine> = useCallback(
		({ item, index }) => {
			return (
				<LyricLineItem
					item={item}
					index={index}
					currentLineIndex={currentLineIndex}
					onPress={handleLyricPress}
				/>
			)
		},
		[currentLineIndex, handleLyricPress],
	)

	// Removed getItemLayout to prevent crashes with dynamic content heights

	const keyExtractor = useCallback(
		(item: ParsedLyricLine, index: number) => `lyric-${index}-${item.startTime}`,
		[],
	)

	if (!parsedLyrics.length) {
		return (
			<SafeAreaView style={{ flex: 1 }}>
				<View flex={1}>
					<ZStack fullscreen>
						<BlurredBackground width={width} height={height} />
						<YStack fullscreen justifyContent='center' alignItems='center'>
							<Text fontSize={18} color='$neutral' textAlign='center'>
								No lyrics available
							</Text>
						</YStack>
					</ZStack>
				</View>
			</SafeAreaView>
		)
	}

	return (
		<SafeAreaView style={{ flex: 1 }}>
			<View flex={1}>
				<ZStack fullscreen>
					<BlurredBackground width={width} height={height} />

					<YStack fullscreen>
						{/* Header with back button */}
						<XStack
							alignItems='center'
							justifyContent='space-between'
							paddingHorizontal='$4'
							paddingVertical='$2'
							marginTop='$2'
						>
							<XStack
								alignItems='center'
								onPress={handleBackPress}
								hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
							>
								<MaterialDesignIcons
									color={theme.color.val}
									name={
										Platform.OS === 'android' ? 'chevron-left' : 'chevron-down'
									}
									size={28}
								/>
							</XStack>
							<Spacer width={28} /> {/* Balance the layout */}
						</XStack>

						<AnimatedFlatList
							ref={flatListRef}
							data={parsedLyrics}
							renderItem={renderLyricItem}
							keyExtractor={keyExtractor}
							onScroll={scrollHandler}
							scrollEventThrottle={16}
							showsVerticalScrollIndicator={false}
							contentContainerStyle={{
								paddingTop: height * 0.1,
								paddingBottom: height * 0.5,
							}}
							style={{ flex: 1 }}
							removeClippedSubviews={false}
							maxToRenderPerBatch={15}
							windowSize={15}
							initialNumToRender={15}
						/>
					</YStack>
				</ZStack>
			</View>
		</SafeAreaView>
	)
}
