import React, { memo } from 'react'
import { StyleSheet, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'
import Snowfall from './snow'
import StringLights from './lights'
import { useHolidayTokens } from './hooks'
import useIsLightMode from '../../hooks/use-is-light-mode'
import { LIGHTS_HEIGHT } from './tokens'

/**
 * Gradient stops for the Now Playing sheet, from the design:
 * `radial-gradient(120% 70% at 50% 34%, a 0%, b 55-60%, c 100%)`
 */
const SHEET_GRADIENT = {
	dark: { colors: ['#173A28', '#0A170F', '#050B08'], middle: 0.55 },
	light: { colors: ['#FFFFFF', '#F4EFE4', '#ECE5D6'], middle: 0.6 },
} as const

/**
 * Now Playing background while Holidays is active: a pine-green glow behind the artwork,
 * falling snow, and a strand of lights across the top of the sheet.
 *
 * Everything here is static vector art, so unlike the blurhash background it needs no image
 * decoding and no per-track work.
 */
function HolidayPlayerBackground(): React.JSX.Element {
	const isLight = useIsLightMode()
	const tokens = useHolidayTokens()
	const { height } = useWindowDimensions()
	const { top } = useSafeAreaInsets()

	const gradient = isLight ? SHEET_GRADIENT.light : SHEET_GRADIENT.dark

	return (
		<View pointerEvents='none' style={StyleSheet.absoluteFill}>
			<Svg width='100%' height='100%'>
				<Defs>
					<RadialGradient
						id='sheet'
						cx='50%'
						cy='34%'
						rx='120%'
						ry='70%'
						fx='50%'
						fy='34%'
					>
						<Stop offset='0' stopColor={gradient.colors[0]} />
						<Stop offset={gradient.middle} stopColor={gradient.colors[1]} />
						<Stop offset='1' stopColor={gradient.colors[2]} />
					</RadialGradient>
				</Defs>
				<Rect width='100%' height='100%' fill='url(#sheet)' />
			</Svg>

			<Snowfall height={height - top} count={70} seed={3} color={tokens.snow} />

			<View style={styles.lights}>
				<StringLights />
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	lights: {
		position: 'absolute',
		top: 4,
		left: 0,
		right: 0,
		height: LIGHTS_HEIGHT,
		overflow: 'hidden',
	},
})

export default memo(HolidayPlayerBackground)
