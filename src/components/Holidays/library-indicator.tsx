import React, { memo, useEffect } from 'react'
import { StyleSheet, useWindowDimensions } from 'react-native'
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated'
import { useTheme } from 'tamagui'
import CandyStripe from './candy-stripe'
import { useHolidayTokens } from './hooks'

/** Height of the Library tab strip in the design; the indicator sits on its bottom edge */
export const LIBRARY_STRIP_HEIGHT = 48
const INDICATOR_HEIGHT = 4

type HolidayTabIndicatorProps = {
	index: number
	count: number
}

/**
 * Candy cane underline for the active Library tab. It slides on the UI thread (a shared
 * value + transform), so switching tabs never touches the JS thread beyond the initial render.
 */
function HolidayTabIndicator({ index, count }: HolidayTabIndicatorProps): React.JSX.Element {
	const theme = useTheme()
	const tokens = useHolidayTokens()
	const { width } = useWindowDimensions()

	const tabWidth = width / count
	const x = useSharedValue(index * tabWidth)

	useEffect(() => {
		x.set(withTiming(index * tabWidth, { duration: 220, easing: Easing.out(Easing.cubic) }))
	}, [index, tabWidth, x])

	const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }))

	return (
		<Animated.View pointerEvents='none' style={[styles.indicator, { width: tabWidth }, style]}>
			<CandyStripe
				width={tabWidth}
				height={INDICATOR_HEIGHT}
				color={theme.primary.val}
				cane={tokens.cane}
				band={6}
				radius={INDICATOR_HEIGHT / 2}
			/>
		</Animated.View>
	)
}

const styles = StyleSheet.create({
	indicator: {
		position: 'absolute',
		left: 0,
		top: LIBRARY_STRIP_HEIGHT - INDICATOR_HEIGHT,
		// The tab bar itself sits at zIndex 1 and would paint over the indicator
		zIndex: 2,
	},
})

export default memo(HolidayTabIndicator)
