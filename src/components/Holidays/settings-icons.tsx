import React, { memo } from 'react'
import Svg, { Circle, Path, Rect } from 'react-native-svg'

/** Row icons for the Holidays Settings screen, ported from the design (32px, 24px viewBox) */

type RowIconProps = {
	/** Main fill */
	color: string
	/** Knockout color, the screen background */
	cutout: string
}

export const AppearanceIcon = memo(function AppearanceIcon({ color, cutout }: RowIconProps) {
	return (
		<Svg width={32} height={32} viewBox='0 0 24 24'>
			<Path
				d='M12 2.5C6.5 2.5 2.5 6.6 2.5 11.6c0 4.6 3.6 8.4 8.2 8.4 1.3 0 1.9-.8 1.9-1.7 0-1.3-1-1.6-1-2.8 0-1 .8-1.7 1.9-1.7h2.3c2.7 0 5.7-1.8 5.7-5.4 0-3.6-4.2-5.9-9.5-5.9z'
				fill={color}
			/>
			<Circle cx={7.2} cy={11} r={1.6} fill={cutout} />
			<Circle cx={9.6} cy={7} r={1.6} fill={cutout} />
			<Circle cx={14.4} cy={6.4} r={1.6} fill={cutout} />
			<Circle cx={17.8} cy={9.6} r={1.6} fill={cutout} />
		</Svg>
	)
})

export const GesturesIcon = memo(function GesturesIcon({ color }: RowIconProps) {
	return (
		<Svg width={32} height={32} viewBox='0 0 24 24'>
			<Path
				d='M5 6.5C7 4 9.5 3 12 3s5 1 7 3.5M5 6.5V3.5M5 6.5h3M19 6.5V3.5M19 6.5h-3'
				fill='none'
				stroke={color}
				strokeWidth={2}
				strokeLinecap='round'
				strokeLinejoin='round'
			/>
			<Path
				d='M10 9.5a1.5 1.5 0 0 1 3 0V14l3.6.8c1 .2 1.6 1.2 1.4 2.2L17.2 21H10.4L7.3 17c-.6-.8-.4-1.9.4-2.4.7-.4 1.5-.3 2.1.3l.2.2z'
				fill={color}
			/>
		</Svg>
	)
})

export const PlaybackIcon = memo(function PlaybackIcon({ color, cutout }: RowIconProps) {
	return (
		<Svg width={32} height={32} viewBox='0 0 24 24'>
			<Circle cx={12} cy={12} r={10} fill={color} />
			<Path d='M10 8l6 4-6 4z' fill={cutout} />
		</Svg>
	)
})

export const StorageIcon = memo(function StorageIcon({ color, cutout }: RowIconProps) {
	return (
		<Svg width={32} height={32} viewBox='0 0 24 24'>
			<Rect x={4} y={2.5} width={16} height={19} rx={2.5} fill={color} />
			<Circle cx={12} cy={10} r={4.2} fill='none' stroke={cutout} strokeWidth={1.8} />
			<Path d='M12 10l3.5 7' stroke={cutout} strokeWidth={1.8} strokeLinecap='round' />
			<Circle cx={7} cy={18.5} r={1} fill={cutout} />
		</Svg>
	)
})

export const PrivacyIcon = memo(function PrivacyIcon({ color, cutout }: RowIconProps) {
	return (
		<Svg width={32} height={32} viewBox='0 0 24 24'>
			<Path d='M12 2l8 3v6.5c0 5-3.4 8.9-8 10.5-4.6-1.6-8-5.5-8-10.5V5z' fill={color} />
			<Circle cx={12} cy={9.5} r={2.6} fill={cutout} />
			<Path
				d='M7.5 16.5c.9-2 2.6-3 4.5-3s3.6 1 4.5 3c-1.2 1.4-2.7 2.4-4.5 3.1-1.8-.7-3.3-1.7-4.5-3.1z'
				fill={cutout}
			/>
		</Svg>
	)
})

export const AboutIcon = memo(function AboutIcon({ color, cutout }: RowIconProps) {
	return (
		<Svg width={32} height={32} viewBox='0 0 24 24'>
			<Circle cx={12} cy={12} r={10} fill={color} />
			<Circle cx={12} cy={7.5} r={1.4} fill={cutout} />
			<Rect x={10.8} y={10.2} width={2.4} height={7.5} rx={1.2} fill={cutout} />
		</Svg>
	)
})

export const ChevronRightIcon = memo(function ChevronRightIcon({
	color,
	size = 22,
	strokeWidth = 2.4,
}: {
	color: string
	size?: number
	strokeWidth?: number
}) {
	return (
		<Svg
			width={size}
			height={size}
			viewBox='0 0 24 24'
			fill='none'
			stroke={color}
			strokeWidth={strokeWidth}
			strokeLinecap='round'
			strokeLinejoin='round'
		>
			<Path d='M9 5l7 7-7 7' />
		</Svg>
	)
})

/** Santa hat worn by the account avatar */
export const AvatarHat = memo(function AvatarHat() {
	return (
		<Svg width={38} height={28} viewBox='0 0 38 28'>
			<Path d='M4 22C6 12 14 6 24 7C29 7.5 33 5 36 3C34.5 8 31 13 28 18Z' fill='#D7373D' />
			<Path
				d='M2.5 23C10 18.5 20 17.5 29.5 19'
				fill='none'
				stroke='#FFFFFF'
				strokeWidth={5}
				strokeLinecap='round'
			/>
			<Circle cx={35.5} cy={3.5} r={3.2} fill='#FFFFFF' />
		</Svg>
	)
})

/** Account glyph shown when the user has no profile picture */
export const AccountGlyph = memo(function AccountGlyph() {
	return (
		<Svg width={32} height={32} viewBox='0 0 24 24'>
			<Circle cx={9} cy={8} r={4} fill='#FFFFFF' />
			<Path d='M2 20c0-3.6 3.1-6 7-6 1.4 0 2.7.3 3.8.9V20z' fill='#FFFFFF' />
			<Path
				d='M16 18.5V10l5-1.2v2.4L18 12v6.5'
				fill='none'
				stroke='#FFFFFF'
				strokeWidth={1.8}
				strokeLinejoin='round'
			/>
			<Circle cx={14.5} cy={18.5} r={2} fill='#FFFFFF' />
		</Svg>
	)
})

export const LockIcon = memo(function LockIcon({ color }: { color: string }) {
	return (
		<Svg width={16} height={18} viewBox='0 0 16 18'>
			<Rect x={1} y={7.5} width={14} height={10} rx={2} fill={color} />
			<Path d='M4 7.5V5a4 4 0 0 1 8 0v2.5' fill='none' stroke={color} strokeWidth={2} />
		</Svg>
	)
})

export const SignOutIcon = memo(function SignOutIcon({ color }: { color: string }) {
	return (
		<Svg
			width={24}
			height={24}
			viewBox='0 0 24 24'
			fill='none'
			stroke={color}
			strokeWidth={2.2}
			strokeLinecap='round'
			strokeLinejoin='round'
		>
			<Path d='M10 4H5v16h5M14 8l4 4-4 4M18 12H9' />
		</Svg>
	)
})
