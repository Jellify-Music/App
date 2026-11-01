import React from 'react'
import Svg, { Path } from 'react-native-svg'

/**
 * Round red / green swatch for the Holidays color scheme card.
 * Matches the design's `conic-gradient(#C8322A 0 50%, #1E6A44 50% 100%)`: red on the
 * right half, green on the left.
 */
function HolidaysSwatch({ size = 20 }: { size?: number }): React.JSX.Element {
	return (
		<Svg width={size} height={size} viewBox='0 0 24 24'>
			<Path d='M12 0A12 12 0 0 1 12 24Z' fill='#C8322A' />
			<Path d='M12 24A12 12 0 0 1 12 0Z' fill='#1E6A44' />
		</Svg>
	)
}

export default React.memo(HolidaysSwatch)
