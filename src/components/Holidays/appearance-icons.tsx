import React, { memo } from 'react'
import Svg, { Circle, Path } from 'react-native-svg'

/** Theme option icons for the Holidays Appearance screen, ported from the design (26px) */

type IconProps = { color: string }

export const MatchDeviceIcon = memo(function MatchDeviceIcon({ color }: IconProps) {
	return (
		<Svg
			width={26}
			height={26}
			viewBox='0 0 24 24'
			fill='none'
			stroke={color}
			strokeWidth={1.8}
			strokeLinecap='round'
		>
			<Circle cx={12} cy={12} r={4} />
			<Path d='M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4M3 21L21 3' />
		</Svg>
	)
})

export const LightThemeIcon = memo(function LightThemeIcon({ color }: IconProps) {
	return (
		<Svg
			width={26}
			height={26}
			viewBox='0 0 24 24'
			fill='none'
			stroke={color}
			strokeWidth={2}
			strokeLinecap='round'
		>
			<Circle cx={12} cy={12} r={4.5} fill={color} />
			<Path d='M12 1.5v2.5M12 20v2.5M1.5 12h2.5M20 12h2.5M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7' />
		</Svg>
	)
})

export const DarkThemeIcon = memo(function DarkThemeIcon({ color }: IconProps) {
	return (
		<Svg
			width={26}
			height={26}
			viewBox='0 0 24 24'
			fill='none'
			stroke={color}
			strokeWidth={1.8}
			strokeLinejoin='round'
		>
			<Path d='M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z' />
			<Path d='M17 3l.7 1.6 1.6.7-1.6.7L17 7.6l-.7-1.6-1.6-.7 1.6-.7z' fill={color} />
		</Svg>
	)
})

export const OledThemeIcon = memo(function OledThemeIcon({ color }: IconProps) {
	return (
		<Svg width={26} height={26} viewBox='0 0 24 24'>
			<Path
				d='M12 3c3 4 6.5 7.5 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10.5 9 7 12 3z'
				fill='none'
				stroke={color}
				strokeWidth={1.8}
			/>
			<Path d='M12 3c-3 4-6.5 7.5-6.5 11.5A6.5 6.5 0 0 0 12 21z' fill={color} />
		</Svg>
	)
})
