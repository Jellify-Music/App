import React, { useEffect } from 'react'
import Animated, {
	useSharedValue,
	useAnimatedProps,
	useAnimatedReaction,
	withTiming,
	Easing,
} from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'
import { useTheme } from 'tamagui'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

interface CircularProgressIndicatorProps {
	size?: number
	strokeWidth?: number
	/** Progress value between 0 and 1 */
	progress: number
}

export default function CircularProgressIndicator({
	size = 40,
	strokeWidth = 4,
	progress,
}: CircularProgressIndicatorProps) {
	const theme = useTheme()

	const radius = (size - strokeWidth) / 2
	const circumference = 2 * Math.PI * radius
	const center = size / 2

	// Raw input shared value — updated immediately from the JS prop
	const progressSV = useSharedValue(progress)

	// Animated stroke offset shared value — driven smoothly by useAnimatedReaction
	const strokeDashoffset = useSharedValue(circumference * (1 - progress))

	// Keep progressSV in sync with the incoming prop
	useEffect(() => {
		progressSV.value = progress
	}, [progress])

	// React to changes in progressSV and animate the stroke offset
	useAnimatedReaction(
		() => progressSV.value,
		(current, previous) => {
			if (current !== previous) {
				strokeDashoffset.value = withTiming(circumference * (1 - current), {
					duration: 300,
					easing: Easing.out(Easing.quad),
				})
			}
		},
	)

	const animatedProps = useAnimatedProps(() => ({
		strokeDashoffset: strokeDashoffset.value,
	}))

	return (
		<Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
			{/* Progress arc */}
			<AnimatedCircle
				cx={center}
				cy={center}
				r={radius}
				strokeWidth={strokeWidth}
				stroke={theme.success.val}
				fill='none'
				strokeDasharray={circumference}
				strokeLinecap='round'
				animatedProps={animatedProps}
			/>
		</Svg>
	)
}
