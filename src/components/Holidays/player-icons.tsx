import React, { memo } from 'react'
import Svg, { Circle, Path, Rect } from 'react-native-svg'

/** Transport and footer icons as drawn in the Holidays design */

type IconProps = { color: string }

export const ShuffleIcon = memo(function ShuffleIcon({ color }: IconProps) {
	return (
		<Svg
			width={26}
			height={26}
			viewBox='0 0 24 24'
			fill='none'
			stroke={color}
			strokeWidth={2.2}
			strokeLinecap='round'
			strokeLinejoin='round'
		>
			<Path d='M3 6h3.5c2 0 3 1 4.2 2.6l2.6 3.8C14.5 14 15.5 15 17.5 15H21M18 12l3 3-3 3M3 18h3.5c1.4 0 2.3-.5 3.1-1.3M14.4 7.3c.8-.8 1.7-1.3 3.1-1.3H21M18 3l3 3-3 3' />
		</Svg>
	)
})

export const RepeatIcon = memo(function RepeatIcon({ color }: IconProps) {
	return (
		<Svg
			width={26}
			height={26}
			viewBox='0 0 24 24'
			fill='none'
			stroke={color}
			strokeWidth={2.2}
			strokeLinecap='round'
			strokeLinejoin='round'
		>
			<Path d='M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h16M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4' />
		</Svg>
	)
})

export const PreviousIcon = memo(function PreviousIcon({ color }: IconProps) {
	return (
		<Svg width={30} height={30} viewBox='0 0 24 24'>
			<Path d='M5 4v16' stroke={color} strokeWidth={2.6} strokeLinecap='round' />
			<Path d='M20 4L8 12l12 8z' fill={color} />
		</Svg>
	)
})

export const NextIcon = memo(function NextIcon({ color }: IconProps) {
	return (
		<Svg width={30} height={30} viewBox='0 0 24 24'>
			<Path d='M19 4v16' stroke={color} strokeWidth={2.6} strokeLinecap='round' />
			<Path d='M4 4l12 8-12 8z' fill={color} />
		</Svg>
	)
})

export const QueueIcon = memo(function QueueIcon({ color }: IconProps) {
	return (
		<Svg
			width={26}
			height={26}
			viewBox='0 0 24 24'
			fill='none'
			stroke={color}
			strokeWidth={2.2}
			strokeLinecap='round'
		>
			<Path d='M3 6h12M3 11h12M3 16h7M17 18V8l4-1' />
			<Circle cx={15} cy={18} r={2} />
		</Svg>
	)
})

export const CastIcon = memo(function CastIcon({ color }: IconProps) {
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
			<Rect x={11} y={3} width={10} height={18} rx={2} />
			<Circle cx={16} cy={14} r={2.5} />
			<Path d='M3 13a8 8 0 0 1 8 8M3 17a4 4 0 0 1 4 4' />
		</Svg>
	)
})
