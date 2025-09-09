import React, { useMemo, useCallback } from 'react'
import { View, Dimensions } from 'react-native'
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withSpring,
	interpolate,
	Extrapolate,
} from 'react-native-reanimated'
import { runOnJS } from 'react-native-worklets'

import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { useTheme } from 'tamagui'
import { Text } from '../../Global/helpers/text'
import ItemImage from '../../Global/components/image'
import useRawLyrics from '../../../api/queries/lyrics'
import { useProgress } from '../../../providers/Player/hooks/queries'
import { UPDATE_INTERVAL } from '../../../player/config'
import { trigger } from 'react-native-haptic-feedback'
import Icon from '../../Global/components/icon'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { PlayerParamList } from '../../../screens/Player/types'

interface LyricLine {
	Text: string
	Start: number // in 100ns ticks (10,000,000 ticks = 1 second)
}

interface ParsedLyricLine {
	text: string
	startTime: number // in seconds
	index: number
}

interface FlipCardProps {
	item: BaseItemDto
	onPress?: () => void
}

const { width: screenWidth } = Dimensions.get('window')
const cardSize = Math.min(screenWidth * 0.7, 300)

export default function FlipCard({ item, onPress }: FlipCardProps): React.JSX.Element {
	const theme = useTheme()
	const { data: lyrics } = useRawLyrics()
	const { position } = useProgress(UPDATE_INTERVAL)
	const navigation = useNavigation<NativeStackNavigationProp<PlayerParamList>>()

	const flipValue = useSharedValue(0)
	const isFlipped = useSharedValue(false)

	// Parse lyrics similar to the lyrics component
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

	// Find current lyric line
	const currentLyricIndex = useMemo(() => {
		if (!position || parsedLyrics.length === 0) return -1

		for (let i = parsedLyrics.length - 1; i >= 0; i--) {
			if (position >= parsedLyrics[i].startTime) {
				return i
			}
		}
		return -1
	}, [position, parsedLyrics])

	const handlePress = useCallback(() => {
		trigger('impactMedium')

		if (parsedLyrics.length > 0) {
			isFlipped.value = !isFlipped.value
			flipValue.value = withSpring(isFlipped.value ? 1 : 0, {
				damping: 15,
				stiffness: 100,
			})
		}

		onPress?.()
	}, [parsedLyrics.length, onPress])

	const handleLongPress = useCallback(() => {
		trigger('impactHeavy')

		if (parsedLyrics.length > 0) {
			// Navigate to full lyrics screen
			navigation.navigate('LyricsScreen', {
				lyrics: lyrics,
			})
		}
	}, [parsedLyrics.length, lyrics, navigation])

	// Front side (album art) animated style
	const frontAnimatedStyle = useAnimatedStyle(() => {
		const rotateY = interpolate(flipValue.value, [0, 1], [0, 180], Extrapolate.CLAMP)
		const scale = interpolate(flipValue.value, [0, 0.5, 1], [1, 0.95, 1], Extrapolate.CLAMP)

		return {
			transform: [{ rotateY: `${rotateY}deg` }, { scale }],
			opacity: flipValue.value < 0.5 ? 1 : 0,
		}
	})

	// Back side (lyrics) animated style
	const backAnimatedStyle = useAnimatedStyle(() => {
		const rotateY = interpolate(flipValue.value, [0, 1], [180, 360], Extrapolate.CLAMP)
		const scale = interpolate(flipValue.value, [0, 0.5, 1], [1, 0.95, 1], Extrapolate.CLAMP)

		return {
			transform: [{ rotateY: `${rotateY}deg` }, { scale }],
			opacity: flipValue.value > 0.5 ? 1 : 0,
		}
	})

	// Container animated style for perspective
	const containerAnimatedStyle = useAnimatedStyle(() => {
		return {
			transform: [
				{
					perspective: 1000,
				},
			],
		}
	})

	// Create gesture for tap and long press
	const gesture = Gesture.Exclusive(
		Gesture.Tap().onEnd(() => {
			runOnJS(handlePress)()
		}),
		Gesture.LongPress()
			.minDuration(500)
			.onStart(() => {
				runOnJS(handleLongPress)()
			}),
	)

	return (
		<GestureDetector gesture={gesture}>
			<Animated.View style={[containerAnimatedStyle, { width: cardSize, height: cardSize }]}>
				<View
					style={{
						width: cardSize,
						height: cardSize,
						position: 'relative',
					}}
				>
					{/* Front side - Album Art */}
					<Animated.View
						style={[
							{
								position: 'absolute',
								width: cardSize,
								height: cardSize,
								backfaceVisibility: 'hidden',
							},
							frontAnimatedStyle,
						]}
					>
						<ItemImage
							item={item}
							width={cardSize}
							height={cardSize}
							style={{
								borderRadius: 20,
								shadowColor: theme.borderColor.val,
								shadowOffset: { width: 0, height: 8 },
								shadowOpacity: 0.3,
								shadowRadius: 12,
							}}
						/>
						{/* Lyrics indicator */}
						{parsedLyrics.length > 0 && (
							<Animated.View
								style={{
									position: 'absolute',
									top: 12,
									right: 12,
									backgroundColor: theme.primary.val + '20',
									borderRadius: 12,
									padding: 6,
								}}
							>
								<Icon name='music-note' small color='$primary' />
							</Animated.View>
						)}
					</Animated.View>

					{/* Back side - Lyrics */}
					<Animated.View
						style={[
							{
								position: 'absolute',
								width: cardSize,
								height: cardSize,
								backfaceVisibility: 'hidden',
								backgroundColor: theme.background.val,
								borderRadius: 20,
								padding: 20,
								justifyContent: 'center',
								alignItems: 'center',
								shadowColor: theme.borderColor.val,
								shadowOffset: { width: 0, height: 8 },
								shadowOpacity: 0.3,
								shadowRadius: 12,
							},
							backAnimatedStyle,
						]}
					>
						{/* Tap to flip back indicator */}
						<View
							style={{
								position: 'absolute',
								top: 12,
								right: 12,
								backgroundColor: theme.primary.val + '20',
								borderRadius: 12,
								padding: 6,
							}}
						></View>

						{/* Long press hint */}
						<View
							style={{
								position: 'absolute',
								bottom: 12,
								left: 12,
								right: 12,
								backgroundColor: theme.primary.val + '10',
								borderRadius: 8,
								padding: 6,
								alignItems: 'center',
							}}
						>
							<Text fontSize={10} color='$primary' opacity={0.7} textAlign='center'>
								Long press for full lyrics
							</Text>
						</View>

						{parsedLyrics.length > 0 ? (
							<View
								style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
							>
								{currentLyricIndex >= 0 &&
								currentLyricIndex < parsedLyrics.length ? (
									<>
										<Text
											bold
											fontSize={16}
											color={theme.primary.val}
											textAlign='center'
											numberOfLines={3}
											style={{ marginBottom: 8 }}
										>
											{parsedLyrics[currentLyricIndex].text}
										</Text>
										{currentLyricIndex + 1 < parsedLyrics.length && (
											<Text
												fontSize={14}
												color={theme.neutral.val}
												textAlign='center'
												numberOfLines={2}
												opacity={0.7}
											>
												{parsedLyrics[currentLyricIndex + 1].text}
											</Text>
										)}
									</>
								) : (
									<Text
										fontSize={16}
										color={theme.neutral.val}
										textAlign='center'
										opacity={0.7}
									>
										Lyrics available
									</Text>
								)}
							</View>
						) : (
							<View
								style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
							>
								<Text
									fontSize={16}
									color={theme.neutral.val}
									textAlign='center'
									opacity={0.7}
								>
									No lyrics available
								</Text>
							</View>
						)}
					</Animated.View>
				</View>
			</Animated.View>
		</GestureDetector>
	)
}
