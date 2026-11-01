import React, { memo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import { useTheme } from 'tamagui'
import type { NativeStackHeaderProps } from '@react-navigation/native-stack'
import Snowfall from './snow'
import StringLights from './lights'
import { FlakeIcon, HollyIcon, StarIcon } from './icons'
import { useHolidayTokens } from './hooks'
import { DESIGN_TOP_INSET, HEADER_BELOW_INSET, LIGHTS_HEIGHT } from './tokens'

export type HolidayHeaderIcon = 'holly' | 'flake' | 'star'

export type HolidayHeaderProps = {
	title: string
	icon?: HolidayHeaderIcon
	/** Snow density and layout, seeded so each screen gets its own sky */
	snow: { count: number; seed: number }
	back?: { title: string; onPress: () => void }
}

/**
 * Header for the top level screens in the Holidays design: snow falling behind a centered
 * title, with a strand of lights hung along the bottom edge. The design is 128px tall on a
 * device with a 62px top inset (status area + 66px).
 */
function HolidayHeader({ title, icon, snow, back }: HolidayHeaderProps): React.JSX.Element {
	const theme = useTheme()
	const tokens = useHolidayTokens()
	const { top } = useSafeAreaInsets()

	const height = top + HEADER_BELOW_INSET
	// All design offsets were measured against a 62px inset
	const shift = top - DESIGN_TOP_INSET

	return (
		<View style={[styles.header, { height, backgroundColor: theme.background.val }]}>
			<Snowfall
				height={height - LIGHTS_HEIGHT}
				count={snow.count}
				seed={snow.seed}
				color={tokens.snow}
			/>

			{back ? (
				<View style={[styles.backRow, { top: 60 + shift }]}>
					<Pressable
						accessibilityRole='button'
						accessibilityLabel={`Back to ${back.title}`}
						onPress={back.onPress}
						style={[
							styles.pill,
							{ backgroundColor: tokens.surface, borderColor: tokens.outline },
						]}
					>
						<Svg width={22} height={22} viewBox='0 0 24 24'>
							<Path
								d='M15 5l-7 7 7 7'
								fill='none'
								stroke={theme.color.val}
								strokeWidth={2.6}
								strokeLinecap='round'
								strokeLinejoin='round'
							/>
						</Svg>
						<Text style={[styles.pillText, { color: theme.color.val }]}>
							{back.title}
						</Text>
					</Pressable>

					<Text style={[styles.title, { color: theme.color.val }]}>{title}</Text>
				</View>
			) : (
				<View style={[styles.titleRow, { top: 70 + shift }]}>
					{icon === 'holly' && (
						<HollyIcon primary={tokens.holly} secondary={tokens.berry} />
					)}
					{icon === 'flake' && <FlakeIcon primary={tokens.flake} />}
					{icon === 'star' && <StarIcon primary={tokens.gold} />}
					<Text style={[styles.title, { color: theme.color.val }]}>{title}</Text>
				</View>
			)}

			<View style={[styles.lights, { top: height - LIGHTS_HEIGHT }]}>
				<StringLights />
			</View>
		</View>
	)
}

/** Adapts {@link HolidayHeader} to the native stack `header` option */
export function HolidayStackHeader({
	props,
	icon,
	snow,
}: {
	props: NativeStackHeaderProps
	icon?: HolidayHeaderIcon
	snow: { count: number; seed: number }
}): React.JSX.Element {
	const { options, route, back, navigation } = props

	const title =
		typeof options.headerTitle === 'string'
			? options.headerTitle
			: (options.title ?? route.name)

	return (
		<HolidayHeader
			title={title}
			icon={icon}
			snow={snow}
			back={
				back
					? { title: back.title ?? 'Back', onPress: () => navigation.goBack() }
					: undefined
			}
		/>
	)
}

const styles = StyleSheet.create({
	header: {
		width: '100%',
	},
	titleRow: {
		position: 'absolute',
		left: 0,
		right: 0,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
	},
	title: {
		fontFamily: 'Figtree-Bold',
		fontSize: 19,
		lineHeight: 23,
	},
	backRow: {
		position: 'absolute',
		left: 16,
		right: 16,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 22,
	},
	pill: {
		height: 44,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingLeft: 12,
		paddingRight: 20,
		borderRadius: 22,
		borderWidth: 1,
	},
	pillText: {
		fontFamily: 'Figtree-Regular',
		fontSize: 18,
	},
	lights: {
		position: 'absolute',
		left: 0,
		right: 0,
		height: LIGHTS_HEIGHT,
		overflow: 'hidden',
	},
})

export default memo(HolidayHeader)
