import React, { memo, useMemo } from 'react'
import { StyleSheet, useWindowDimensions } from 'react-native'
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg'
import { useHolidayTokens } from './hooks'
import { HOLIDAY_TOKENS, LIGHTS_HEIGHT } from './tokens'

const PERIOD = 40
const FIRST_BULB_X = 16

/** Wire: a gentle wave, one swag every {@link PERIOD}px */
function buildWire(width: number): string {
	const swags = Math.ceil(width / PERIOD) + 1
	let d = 'M0 3'
	for (let i = 0; i < swags; i++) {
		const x = i * PERIOD
		d += `Q${x + 20} 17 ${x + PERIOD} 3`
	}
	return d
}

/** Egg-shaped bulb, 8 x 11, rounder at the bottom (matches the design's border-radius) */
const bulbPath = (x: number): string =>
	`M${x} 15.4A4 4.4 0 0 1 ${x + 4} 11A4 4.4 0 0 1 ${x + 8} 15.4A4 6.6 0 0 1 ${x + 4} 22A4 6.6 0 0 1 ${x} 15.4Z`

/** Bulb socket, 5 x 3 with 1px corners, centered on the bulb */
const capPath = (x: number): string => {
	const left = x + 1.5
	return `M${left + 1} 8h3a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1Z`
}

type StringLightsProps = {
	/** Defaults to the window width */
	width?: number
	/** Always use the dark mode strand, for surfaces that stay dark in light mode */
	dark?: boolean
}

/**
 * Strand of Christmas lights, 24px tall. Static SVG: the wire, sockets and the four bulb
 * colors are each a single path, so the whole strand is a handful of shapes drawn once.
 */
function StringLights({ width, dark }: StringLightsProps): React.JSX.Element {
	const { width: windowWidth } = useWindowDimensions()
	const w = width ?? windowWidth
	const tokens = useHolidayTokens()
	const lights = dark ? HOLIDAY_TOKENS.dark.lights : tokens.lights

	const geometry = useMemo(() => {
		const count = Math.ceil((w - FIRST_BULB_X) / PERIOD)
		const bulbXs = Array.from({ length: count }, (_, k) => FIRST_BULB_X + PERIOD * k)

		return {
			wire: buildWire(w),
			caps: bulbXs.map(capPath).join(''),
			// Bulb bodies grouped per color: 4 paths instead of one shape per bulb
			bodies: lights.bulbs.map((_, colorIndex) =>
				bulbXs
					.filter((_x, k) => k % lights.bulbs.length === colorIndex)
					.map(bulbPath)
					.join(''),
			),
			glows: bulbXs.map((x, k) => ({ cx: x + 4, color: k % lights.bulbs.length })),
		}
	}, [w, lights.bulbs])

	return (
		<Svg width={w} height={LIGHTS_HEIGHT} pointerEvents='none' style={styles.strand}>
			{lights.glow && (
				<Defs>
					{lights.bulbs.map((color, index) => (
						<RadialGradient key={color} id={`glow${index}`} cx='50%' cy='50%' r='50%'>
							<Stop offset='0' stopColor={color} stopOpacity='0.6' />
							<Stop offset='0.45' stopColor={color} stopOpacity='0.26' />
							<Stop offset='1' stopColor={color} stopOpacity='0' />
						</RadialGradient>
					))}
				</Defs>
			)}

			<Path d={geometry.wire} stroke={lights.wire} strokeWidth={1.4} fill='none' />

			{lights.glow &&
				geometry.glows.map((glow) => (
					<Circle
						key={glow.cx}
						cx={glow.cx}
						cy={16.5}
						r={12}
						fill={`url(#glow${glow.color})`}
					/>
				))}

			<Path d={geometry.caps} fill={lights.cap} />

			{geometry.bodies.map((d, index) => (
				<Path key={lights.bulbs[index]} d={d} fill={lights.bulbs[index]} />
			))}
		</Svg>
	)
}

const styles = StyleSheet.create({
	strand: {
		position: 'absolute',
		top: 0,
		left: 0,
	},
})

export default memo(StringLights)
