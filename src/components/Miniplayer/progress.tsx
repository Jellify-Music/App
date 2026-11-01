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
import { StyleSheet, View, useWindowDimensions } from 'react-native'
import CandyStripe from '../Holidays/candy-stripe'
import { useHolidayTokens, useIsHolidays } from '../Holidays/hooks'

const HOLIDAY_TRACK_HEIGHT = 3

const styles = StyleSheet.create({
	holidayTrack: {
		height: HOLIDAY_TRACK_HEIGHT,
		width: '100%',
	},
	holidayFill: {
		position: 'absolute',
		top: 0,
		left: 0,
		height: HOLIDAY_TRACK_HEIGHT,
	},
})

export default function MiniPlayerProgress(): React.JSX.Element {
	const { position, totalDuration } = useProgress()
	const theme = useTheme()
	const isHolidays = useIsHolidays()
	const holidayTokens = useHolidayTokens()
	const { width } = useWindowDimensions()
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

	if (isHolidays) {
		// Candy cane track under a solid progress fill
		return (
			<View style={styles.holidayTrack}>
				<CandyStripe
					width={width}
					height={HOLIDAY_TRACK_HEIGHT}
					color={theme.primary.val}
					cane={holidayTokens.cane}
					band={5}
					opacity={0.5}
				/>
				<Animated.View
					style={[
						animatedStyle,
						styles.holidayFill,
						{ backgroundColor: theme.primary.val },
					]}
				/>
			</View>
		)
	}

	return (
		<YStack height='0-25' backgroundColor='borderColor' width={'100%'}>
			<Animated.View
				style={[
					animatedStyle,
					{
						height: '100%',
						backgroundColor: theme.primary.val,
						shadowColor: theme.darkBackground75.val,
						shadowOffset: { width: 2, height: 0 },
						shadowOpacity: 0.75,
						shadowRadius: 1,
						borderRadius: 4,
					},
				]}
			/>
		</YStack>
	)
}
