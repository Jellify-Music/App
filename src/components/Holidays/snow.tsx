import React, { memo, useMemo } from 'react'
import { StyleSheet, useWindowDimensions } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { DESIGN_WIDTH } from './tokens'

type Flake = { cx: number; cy: number; r: number; opacity: number }

const flakeCache = new Map<string, Flake[]>()

/**
 * Same seeded generator the design uses, so the snow lands exactly where the design drew it.
 * Results are cached per (height, count, seed): the screens re-use a handful of combinations.
 */
function generateFlakes(height: number, count: number, seed: number): Flake[] {
	const key = `${height}/${count}/${seed}`
	const cached = flakeCache.get(key)
	if (cached) return cached

	let s = seed * 9301 + 49297
	const rnd = () => {
		s = (s * 9301 + 49297) % 233280
		return s / 233280
	}

	const flakes: Flake[] = []
	for (let i = 0; i < count; i++) {
		const size = 1.5 + Math.round(rnd() * 3.5 * 10) / 10
		const x = Math.round(rnd() * 398)
		const y = Math.round(rnd() * (height - 4))
		const opacity = Number((0.25 + rnd() * 0.55).toFixed(2))
		flakes.push({ cx: x + size / 2, cy: y + size / 2, r: size / 2, opacity })
	}

	flakeCache.set(key, flakes)
	return flakes
}

type SnowfallProps = {
	height: number
	count: number
	seed: number
	color: string
	/** Defaults to the window width */
	width?: number
}

/**
 * A fixed field of snowflakes.
 *
 * Deliberately static: it is one non-interactive SVG that is rasterised once, so it costs
 * nothing per frame (no animation driver, no JS thread work after the first render).
 */
function Snowfall({ height, count, seed, color, width }: SnowfallProps): React.JSX.Element {
	const { width: windowWidth } = useWindowDimensions()
	const w = width ?? windowWidth

	const flakes = useMemo(() => generateFlakes(height, count, seed), [height, count, seed])
	const scale = w / DESIGN_WIDTH

	return (
		<Svg width={w} height={height} pointerEvents='none' style={styles.field}>
			{flakes.map((flake, index) => (
				<Circle
					key={index}
					cx={flake.cx * scale}
					cy={flake.cy}
					r={flake.r}
					fill={color}
					fillOpacity={flake.opacity}
				/>
			))}
		</Svg>
	)
}

const styles = StyleSheet.create({
	field: {
		position: 'absolute',
		top: 0,
		left: 0,
	},
})

export default memo(Snowfall)
