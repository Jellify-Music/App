import React, { memo, useEffect } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import Svg, { Circle, Path } from 'react-native-svg'
import { useTheme } from 'tamagui'
import { useHolidayTokens } from './hooks'

/** Selectable card used on the Holidays Appearance screen (theme and color scheme options) */

type HolidayOptionCardProps = {
	label: string
	selected: boolean
	onPress: () => void
	/** Leading icon or swatch */
	leading: React.ReactNode
}

function HolidayOptionCard({
	label,
	selected,
	onPress,
	leading,
}: HolidayOptionCardProps): React.JSX.Element {
	const theme = useTheme()
	const tokens = useHolidayTokens()

	return (
		<Pressable
			accessibilityRole='button'
			accessibilityState={{ selected }}
			onPress={onPress}
			style={[
				styles.card,
				{
					borderColor: selected ? theme.primary.val : tokens.outline,
					backgroundColor: selected ? tokens.selectedFill : 'transparent',
				},
			]}
		>
			{leading}
			<Text style={[styles.label, { color: theme.color.val }]}>{label}</Text>
			{selected && (
				<Svg
					width={28}
					height={28}
					viewBox='0 0 24 24'
					fill='none'
					stroke={theme.primary.val}
					strokeWidth={2}
					strokeLinecap='round'
					strokeLinejoin='round'
				>
					<Circle cx={12} cy={12} r={10} />
					<Path d='M7.5 12.5l3 3 6-6.5' />
				</Svg>
			)}
		</Pressable>
	)
}

export const OptionCard = memo(HolidayOptionCard)

const TRACK_WIDTH = 52
const TRACK_HEIGHT = 30
const KNOB = 24
const TRACK_PADDING = 3

type HolidaySwitchProps = {
	checked: boolean
	onCheckedChange: (checked: boolean) => void
	labelledBy?: string
}

/** The design's 52 x 30 switch. The knob slides on the UI thread. */
function HolidaySwitchBase({ checked, onCheckedChange }: HolidaySwitchProps): React.JSX.Element {
	const theme = useTheme()
	const tokens = useHolidayTokens()

	const offset = useSharedValue(checked ? 1 : 0)

	useEffect(() => {
		offset.set(withTiming(checked ? 1 : 0, { duration: 160 }))
	}, [checked, offset])

	const knob = useAnimatedStyle(() => ({
		transform: [{ translateX: offset.get() * (TRACK_WIDTH - KNOB - TRACK_PADDING * 2) }],
	}))

	return (
		<Pressable
			accessibilityRole='switch'
			accessibilityState={{ checked }}
			onPress={() => onCheckedChange(!checked)}
			style={[
				styles.track,
				{ backgroundColor: checked ? theme.primary.val : tokens.switchTrack },
			]}
		>
			<Animated.View style={[styles.knob, { backgroundColor: tokens.switchKnob }, knob]} />
		</Pressable>
	)
}

export const HolidaySwitch = memo(HolidaySwitchBase)

const styles = StyleSheet.create({
	card: {
		height: 50,
		flex: 1,
		minWidth: '45%',
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingHorizontal: 14,
		borderWidth: 1.5,
		borderRadius: 10,
	},
	label: {
		flex: 1,
		fontFamily: 'Figtree-Bold',
		fontSize: 16.5,
	},
	track: {
		width: TRACK_WIDTH,
		height: TRACK_HEIGHT,
		borderRadius: TRACK_HEIGHT / 2,
		padding: TRACK_PADDING,
		justifyContent: 'center',
	},
	knob: {
		width: KNOB,
		height: KNOB,
		borderRadius: KNOB / 2,
	},
})
