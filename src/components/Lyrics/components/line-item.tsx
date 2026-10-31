import Animated, {
	SharedValue,
	useAnimatedStyle,
	interpolate,
	interpolateColor,
	Extrapolation,
} from 'react-native-reanimated'
import { AnimatedSizableText } from '../../Global/helpers/Animated/text'
import { useTheme } from 'tamagui'
import { ParsedLyricLine } from '../../../types/Lyrics'
import { GestureDetector, useTapGesture } from 'react-native-gesture-handler'

interface LyricLineItemProps {
	item: ParsedLyricLine
	index: number
	currentLineIndex: SharedValue<number>
	onPress: (startTime: number, index: number) => void
	onLayout?: (index: number, height: number) => void
}

export default function LyricLineItem({
	item,
	index,
	currentLineIndex,
	onPress,
	onLayout: onItemLayout,
}: LyricLineItemProps) {
	const theme = useTheme()

	// Get theme-aware colors
	const primaryColor = theme.color.val // Primary text color (adapts to dark/light)
	const neutralColor = theme.color.val + '95' // Secondary text color
	const highlightColor = theme.primary.val // Highlight color (primaryDark/primaryLight)
	const translucentColor = theme.translucent?.val // Theme-aware translucent background
	const backgroundHighlight = translucentColor || theme.primary.val + '15' // Fallback with 15% opacity

	const animatedStyle = useAnimatedStyle(() => {
		const distance = Math.abs(currentLineIndex.value - index)
		const isPast = currentLineIndex.value > index
		const activeProgress = interpolate(distance, [0, 1], [1, 0], Extrapolation.CLAMP)

		return {
			opacity: interpolate(
				distance,
				[0, 1, 2],
				[1, 0.8, isPast ? 0.4 : 0.6],
				Extrapolation.CLAMP,
			),
			transform: [
				{ scale: interpolate(activeProgress, [0, 1], [1, 1.05]) },
				{ translateY: interpolate(activeProgress, [0, 1], [0, -4]) },
			],
		}
	})

	const backgroundStyle = useAnimatedStyle(() => {
		const distance = Math.abs(currentLineIndex.value - index)
		const activeProgress = interpolate(distance, [0, 1], [1, 0], Extrapolation.CLAMP)

		return {
			backgroundColor: interpolateColor(
				activeProgress,
				[0, 1],
				['transparent', backgroundHighlight], // subtle theme-aware glow for active
			),
			borderRadius: interpolate(activeProgress, [0, 1], [8, 12]),
		}
	})

	const textColorStyle = useAnimatedStyle(() => {
		const distance = Math.abs(currentLineIndex.value - index)
		const isPast = currentLineIndex.value > index
		const activeProgress = interpolate(distance, [0, 1], [1, 0], Extrapolation.CLAMP)

		return {
			color: interpolateColor(
				activeProgress,
				[0, 1],
				[isPast ? neutralColor : primaryColor, highlightColor], // theme-aware colors
			),
		}
	})

	const tapGesture = useTapGesture({
		maxDistance: 10,
		maxDuration: 500,
		runOnJS: true,
		onFinalize: (result) => {
			if (!result.canceled) {
				onPress(item.startTime, index)
			}
		},
	})

	const handleLayout = (e: { nativeEvent: { layout: { height: number } } }) => {
		onItemLayout?.(index, e.nativeEvent.layout.height)
	}

	return (
		<Animated.View
			onLayout={handleLayout}
			style={[
				{
					paddingVertical: 4,
					minHeight: 30,
					justifyContent: 'center',
					marginHorizontal: 10,
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
					<AnimatedSizableText style={textColorStyle} textAlign='left'>
						{item.text}
					</AnimatedSizableText>
				</Animated.View>
			</GestureDetector>
		</Animated.View>
	)
}
