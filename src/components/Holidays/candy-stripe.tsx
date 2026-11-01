import React, { memo, useMemo } from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'
import Svg, { Path, Rect } from 'react-native-svg'

const SQRT2 = Math.SQRT2

type CandyStripeProps = {
	width: number
	height: number
	/** Stripe color */
	color: string
	/** Gap color */
	cane: string
	/**
	 * Length of each stripe along the gradient, in px. The design uses
	 * `repeating-linear-gradient(135deg, color 0 N, cane N 2N)` with N = 5 or 6.
	 */
	band: number
	radius?: number
	opacity?: number
	style?: StyleProp<ViewStyle>
}

/**
 * Candy cane stripes: the design's `repeating-linear-gradient(135deg, ...)` drawn as
 * geometry. A 135deg gradient on a thin bar is a set of 45deg diagonals where
 * (x + y) / sqrt(2) falls in the stripe band, so each stripe is one parallelogram and all of
 * them share a single path.
 */
function CandyStripe({
	width,
	height,
	color,
	cane,
	band,
	radius = 0,
	opacity = 1,
	style,
}: CandyStripeProps): React.JSX.Element {
	const d = useMemo(() => {
		const period = band * 2 * SQRT2
		const length = band * SQRT2
		let path = ''
		for (let start = 0; start - height < width; start += period) {
			const end = start + length
			path += `M${start} 0L${end} 0L${end - height} ${height}L${start - height} ${height}Z`
		}
		return path
	}, [width, height, band])

	return (
		<View
			pointerEvents='none'
			style={[{ width, height, borderRadius: radius, overflow: 'hidden', opacity }, style]}
		>
			<Svg width={width} height={height}>
				<Rect width={width} height={height} fill={cane} />
				<Path d={d} fill={color} />
			</Svg>
		</View>
	)
}

export default memo(CandyStripe)
