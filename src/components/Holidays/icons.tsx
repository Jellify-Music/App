import React, { memo } from 'react'
import Svg, { Circle, Path } from 'react-native-svg'

/**
 * Icons drawn for the Holidays design. They replace the stock Material icons only while the
 * Holidays color scheme is active.
 */

type TabIconProps = { color: string }

/** The Jellify jellyfish wearing a Santa hat. 30px, tinted by the tab color */
export const HomeTabIcon = memo(function HomeTabIcon({ color }: TabIconProps) {
	return (
		<Svg width={30} height={30} viewBox='0 0 28 28'>
			<Path d='M5 16C5 9.5 9 7 14 7C19 7 23 9.5 23 16Z' fill={color} />
			<Path
				d='M8.5 17q-1.5 3 0 6M12 17q1.2 3-.4 7M16 17q-1.2 3 .4 7M19.5 17q1.5 3 0 6'
				fill='none'
				stroke={color}
				strokeWidth={1.8}
				strokeLinecap='round'
			/>
			<Path
				d='M8.2 9.2C9.5 4.8 14 3 19 4.2C21.5 4.8 23.6 3.8 25 3.2C23.8 5.2 22 6.8 20.5 8.4Z'
				fill='#D7373D'
			/>
			<Path
				d='M7.4 9.6C11 7.6 16.5 7.2 21.3 8.6'
				fill='none'
				stroke='#FFFFFF'
				strokeWidth={2.6}
				strokeLinecap='round'
			/>
			<Circle cx={25} cy={3.2} r={1.9} fill='#FFFFFF' />
		</Svg>
	)
})

export const LibraryTabIcon = memo(function LibraryTabIcon({ color }: TabIconProps) {
	return (
		<Svg
			width={28}
			height={28}
			viewBox='0 0 24 24'
			fill='none'
			stroke={color}
			strokeWidth={1.9}
			strokeLinecap='round'
			strokeLinejoin='round'
		>
			<Path d='M9 3H19A2 2 0 0 1 21 5V15A2 2 0 0 1 19 17H9A2 2 0 0 1 7 15V5A2 2 0 0 1 9 3Z' />
			<Path d='M3 7v12a2 2 0 0 0 2 2h12' />
			<Path d='M15.5 6v7' />
			<Circle cx={13.5} cy={13} r={2} />
		</Svg>
	)
})

export const SearchTabIcon = memo(function SearchTabIcon({ color }: TabIconProps) {
	return (
		<Svg
			width={28}
			height={28}
			viewBox='0 0 24 24'
			fill='none'
			stroke={color}
			strokeWidth={2.2}
			strokeLinecap='round'
		>
			<Circle cx={10.5} cy={10.5} r={6.5} />
			<Path d='M15.5 15.5l5 5' />
		</Svg>
	)
})

export const DiscoverTabIcon = memo(function DiscoverTabIcon({ color }: TabIconProps) {
	return (
		<Svg
			width={28}
			height={28}
			viewBox='0 0 24 24'
			fill='none'
			stroke={color}
			strokeWidth={2}
			strokeLinecap='round'
		>
			<Circle cx={12} cy={12} r={9} />
			<Path d='M12 7a5 5 0 1 0 5 5' />
			<Circle cx={12} cy={12} r={1.6} fill={color} />
		</Svg>
	)
})

export const SettingsTabIcon = memo(function SettingsTabIcon({ color }: TabIconProps) {
	return (
		<Svg
			width={28}
			height={28}
			viewBox='0 0 24 24'
			fill='none'
			stroke={color}
			strokeWidth={2}
			strokeLinecap='round'
		>
			<Circle cx={12} cy={12} r={6} />
			<Circle cx={12} cy={12} r={2.4} />
			<Path d='M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1' />
		</Svg>
	)
})

type HeaderIconProps = { primary: string; secondary?: string }

/** Holly sprig beside the Home title */
export const HollyIcon = memo(function HollyIcon({ primary, secondary }: HeaderIconProps) {
	return (
		<Svg width={22} height={20} viewBox='0 0 22 20'>
			<Path d='M11 12C7 13 3 11 1 7C3 7 4 5 4 3C6 5 9 5 11 12Z' fill={primary} />
			<Path d='M11 12C15 13 19 11 21 7C19 7 18 5 18 3C16 5 13 5 11 12Z' fill={primary} />
			<Circle cx={9} cy={14} r={2.6} fill={secondary} />
			<Circle cx={13.5} cy={14} r={2.6} fill={secondary} />
			<Circle cx={11.2} cy={17.2} r={2.6} fill={secondary} />
		</Svg>
	)
})

/** Snowflake beside the Search title */
export const FlakeIcon = memo(function FlakeIcon({ primary }: HeaderIconProps) {
	return (
		<Svg
			width={20}
			height={20}
			viewBox='0 0 24 24'
			fill='none'
			stroke={primary}
			strokeWidth={2}
			strokeLinecap='round'
		>
			<Path d='M12 2v20M3.3 7l17.4 10M3.3 17l17.4-10M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5' />
		</Svg>
	)
})

/** Gold star beside the Discover title */
export const StarIcon = memo(function StarIcon({ primary }: HeaderIconProps) {
	return (
		<Svg width={18} height={20} viewBox='0 0 18 20'>
			<Path
				d='M9 1l2 4.2 4.6.7-3.3 3.2.8 4.6L9 11.5l-4.1 2.2.8-4.6L2.4 5.9 7 5.2z'
				fill={primary}
			/>
		</Svg>
	)
})
