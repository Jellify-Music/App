import React, { memo } from 'react'
import Svg, { Path } from 'react-native-svg'

const LARGE_CAP =
	'M4 14C20 2 60 4 92 8C124 1 172 3 204 7C244 0 290 3 312 12L312 18C304 18 302 28 294 28C286 28 288 18 278 18C248 20 238 32 228 32C218 32 220 20 208 20C178 22 160 24 150 36C142 42 132 32 134 22C116 22 86 22 66 20C56 20 54 30 46 30C38 30 40 20 30 20L4 18Z'

const SMALL_CAP =
	'M2 6C12 1 30 2 44 4C60 0 84 1 109 5L109 8C104 8 104 13 99 13C95 13 96 8 90 8C78 9 74 15 68 15C63 15 64 9 58 9C46 10 40 10 36 14C32 16 28 12 29 9C20 9 16 9 12 9C9 9 9 13 6 13C3 13 4 8 2 8Z'

type SnowCapProps = {
	color: string
	/**
	 * `large` is the 316 x 40 cap draped over the player artwork,
	 * `small` is the 111 x 16 cap on the Home cards
	 */
	size: 'large' | 'small'
	/** Stretch to the parent instead of using the design's fixed pixel size */
	fluid?: boolean
}

/**
 * Snow resting on top of artwork. The design gives it a soft drop shadow
 * (`drop-shadow(0 2px 2px rgba(0,0,0,.25))`), drawn here as an offset copy of the shape
 * rather than a blur filter so it stays a plain, cheap vector.
 */
function SnowCap({ color, size, fluid }: SnowCapProps): React.JSX.Element {
	const large = size === 'large'
	const d = large ? LARGE_CAP : SMALL_CAP
	const shadowOffset = large ? 2 : 1

	return (
		<Svg
			width={fluid ? '100%' : large ? 316 : 111}
			height={fluid ? '100%' : large ? 40 : 16}
			viewBox={large ? '0 0 316 40' : '0 0 111 16'}
			preserveAspectRatio='none'
			pointerEvents='none'
		>
			<Path d={d} fill='#000000' fillOpacity={0.2} translateY={shadowOffset} />
			<Path d={d} fill={color} />
		</Svg>
	)
}

export default memo(SnowCap)
