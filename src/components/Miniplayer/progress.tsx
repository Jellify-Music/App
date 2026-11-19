import useAppActive from '../../hooks/use-app-active'
import { useProgress } from '../../player'
import { useRef, useEffect } from 'react'
import Animated, {
	useSharedValue,
	withTiming,
	interpolate,
	ReduceMotion,
	useAnimatedStyle,
	Easing,
} from 'react-native-reanimated'
import { useTheme, YStack } from 'tamagui'

export default function MiniPlayerProgress(): React.JSX.Element {
	const { position, totalDuration } = useProgress()
	const theme = useTheme()
	const progressValue = useSharedValue(position === 0 ? 0 : (position / totalDuration) * 100)

	const previousPosition = useRef<number>(position)

	const isAppActive = useAppActive()

	const handleDisplayPositionChange = (newPosition: number, prevPosition: number) => {
		const timingDuration =
			Math.round(Math.abs(newPosition - (prevPosition ?? 0))) === 1 ? 1000 : 200

		progressValue.set(
			withTiming(interpolate(newPosition, [0, totalDuration], [0, 100]), {
				duration: timingDuration,
				easing: Easing.linear,
				reduceMotion: ReduceMotion.Never,
			}),
		)

		previousPosition.current = newPosition
	}

	useEffect(() => {
		if (isAppActive) {
			handleDisplayPositionChange(position, previousPosition.current)
		}
	}, [position, isAppActive])

	const animatedStyle = useAnimatedStyle(() => ({
		width: `${progressValue.get()}%`,
	}))

	return (
		<YStack height='0-25' backgroundColor='borderColor'>
			<Animated.View
				style={[
					animatedStyle,
					{
						height: '100%',
						backgroundColor: theme.primary.val,
						shadowColor: theme.darkBackground75.val,
						shadowOffset: { width: 4, height: 0 },
						shadowOpacity: 0.75,
						shadowRadius: 2,
						borderRadius: 8,
					},
				]}
			/>
		</YStack>
	)
}
