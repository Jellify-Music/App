import React, { memo, useState } from 'react'
import { LayoutChangeEvent, StyleSheet, View } from 'react-native'
import Animated, {
	Extrapolation,
	SharedValue,
	interpolate,
	useAnimatedStyle,
} from 'react-native-reanimated'
import { useTheme } from 'tamagui'
import CandyStripe from './candy-stripe'
import { useHolidayTokens } from './hooks'

const TRACK_TOP = 5
const TRACK_HEIGHT = 6
const THUMB_SIZE = 14
const THUMB_INSET = 2
export const HOLIDAY_SCRUBBER_HEIGHT = 16

type ScrubberVisualsProps = {
	value: SharedValue<number>
	maxValue: number
}

/**
 * What the Holidays scrubber looks like: a candy cane track, a solid fill, and a thumb with a
 * little gold hook, like an ornament.
 *
 * Purely visual. The stock slider is rendered invisibly on top and keeps handling the
 * gestures and seeking, so this reads the same shared value it writes.
 */
function HolidayScrubberVisuals({ value, maxValue }: ScrubberVisualsProps): React.JSX.Element {
	const theme = useTheme()
	const tokens = useHolidayTokens()
	const [width, setWidth] = useState(0)

	const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)

	const thumbRange = Math.max(width - THUMB_SIZE - THUMB_INSET, 0)

	const progress = useAnimatedStyle(() => ({
		width: interpolate(value.get(), [0, maxValue || 1], [8, width], Extrapolation.CLAMP),
	}))

	const thumb = useAnimatedStyle(() => ({
		transform: [
			{
				translateX:
					THUMB_INSET +
					interpolate(
						value.get(),
						[0, maxValue || 1],
						[0, thumbRange],
						Extrapolation.CLAMP,
					),
			},
		],
	}))

	return (
		<View pointerEvents='none' style={styles.container} onLayout={onLayout}>
			{width > 0 && (
				<>
					<CandyStripe
						width={width}
						height={TRACK_HEIGHT}
						color={theme.primary.val}
						cane={tokens.cane}
						band={6}
						radius={TRACK_HEIGHT / 2}
						opacity={0.45}
						style={styles.track}
					/>

					<Animated.View
						style={[styles.fill, { backgroundColor: theme.primary.val }, progress]}
					/>

					<Animated.View style={[styles.thumb, thumb]}>
						<View style={[styles.hook, { backgroundColor: tokens.gold }]} />
						<View
							style={[
								styles.ball,
								{ backgroundColor: theme.primary.val, borderColor: tokens.gold },
							]}
						/>
					</Animated.View>
				</>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
	},
	track: {
		position: 'absolute',
		top: TRACK_TOP,
		left: 0,
	},
	fill: {
		position: 'absolute',
		top: TRACK_TOP,
		left: 0,
		height: TRACK_HEIGHT,
		borderRadius: TRACK_HEIGHT / 2,
	},
	thumb: {
		position: 'absolute',
		top: 0,
		left: 0,
		alignItems: 'center',
	},
	hook: {
		width: 6,
		height: 3,
		borderRadius: 1,
	},
	ball: {
		width: THUMB_SIZE,
		height: THUMB_SIZE,
		borderRadius: THUMB_SIZE / 2,
		borderWidth: 2,
		marginTop: -1,
	},
})

export default memo(HolidayScrubberVisuals)
