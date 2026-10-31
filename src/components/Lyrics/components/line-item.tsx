import Animated, {
	SharedValue,
	useAnimatedStyle,
	withSpring,
	interpolateColor,
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
			fontWeight: isActive ? '600' : '400',
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
					paddingVertical: 3,
					paddingHorizontal: 20,
					minHeight: 30,
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
					<AnimatedSizableText style={textColorStyle} textAlign='left' fontWeight='400'>
						{item.text}
					</AnimatedSizableText>
				</Animated.View>
			</GestureDetector>
		</Animated.View>
	)
}
