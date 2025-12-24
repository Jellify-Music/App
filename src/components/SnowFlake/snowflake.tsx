import { useEffect } from 'react'
import { View, TextInputContentSizeChangeEvent, StyleSheet } from 'react-native'
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	Easing,
	withRepeat,
	withTiming,
	interpolate,
} from 'react-native-reanimated'

interface SnowflakeDefaultProps {
	delay: number
	duration: number
	opacity: number
	x: number
	size: number
}

const Snowflake = ({ delay, duration, opacity, x, size }: SnowflakeDefaultProps) => {
	const translateX = useSharedValue(-20)
	const translateY = useSharedValue(0)
	const rotate = useSharedValue(0)
	useEffect(() => {
		translateY.value = withDelay(
			delay,
			withRepeat(withTiming(110, { duration, easing: Easing.linear }), -1, false),
		)
		translateX.value = withDelay(
			delay,
			withRepeat(
				withTiming(20, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
				-1,
				true,
			),
		)
		rotate.value = withDelay(
			delay,
			withRepeat(
				withTiming(360, { duration: duration * 1.5, easing: Easing.linear }),
				-1,
				false,
			),
		)
	}, [delay, duration])

	const animatedStyle = useAnimatedStyle(() => {
		return {
			transform: [
				{ translateY: `${translateY.value}%` },
				{ translateX: interpolate(translateX.value, [0, 20], [-10, -10]) },
				{ rotate: `${rotate.value}deg` },
			],
			opacity: interpolate(translateY.value, [-20, 0, 90, 100], [0, opacity, opacity, 0]),
		}
	})

	return (
		<Animated.View
			style={[
				styles.snowflake,
				{
					width: size,
					height: size,
					left: `${x}%`,
				},
				animatedStyle,
			]}
		>
			<Animated.Text style={[styles.snowflakeText, { fontSize: size }]}>❄️</Animated.Text>
		</Animated.View>
	)
}

const styles = StyleSheet.create({
	snowflake: {
		position: 'absolute',
		top: 0,
		zIndex: 1,
	},
	snowflakeText: {
		color: 'white',
		textShadowColor: 'rgba(255,255,255,0.8)',
		textShadowRadius: 4,
		shadowOffset: { width: 0, height: 0 },
	},
})

export default Snowflake
