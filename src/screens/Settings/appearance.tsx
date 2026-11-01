import React from 'react'
import { View } from 'react-native'
import { YStack, XStack, SizableText, ScrollView, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import Icon from '../../components/Global/components/icon'
import { SwitchWithLabel } from '../../components/Global/helpers/switch-with-label'
import { ColorPreset, ThemeSetting, useAppSettingsStore } from '../../stores/settings/app'
import { PRESET_PALETTES } from '../../configs/tamagui.config'
import { MaterialDesignIconsIconName } from '@react-native-vector-icons/material-design-icons'
import HolidaysSwatch from '../../components/Holidays/swatch'
import { HolidaySwitch, OptionCard } from '../../components/Holidays/option-card'
import {
	DarkThemeIcon,
	LightThemeIcon,
	MatchDeviceIcon,
	OledThemeIcon,
} from '../../components/Holidays/appearance-icons'
import { useIsHolidays } from '../../components/Holidays/hooks'

type ThemeOptionConfig = {
	value: ThemeSetting
	label: string
	icon: MaterialDesignIconsIconName
}

type ColorPresetConfig = {
	value: ColorPreset
	label: string
}

const THEME_OPTIONS: ThemeOptionConfig[] = [
	{ value: 'system', label: 'Match Device', icon: 'theme-light-dark' },
	{ value: 'light', label: 'Light', icon: 'white-balance-sunny' },
	{ value: 'dark', label: 'Dark', icon: 'weather-night' },
	{ value: 'oled', label: 'OLED Black', icon: 'invert-colors' },
]

/** Theme icons drawn for the Holidays design */
const HOLIDAY_THEME_ICONS: Record<ThemeSetting, React.ComponentType<{ color: string }>> = {
	system: MatchDeviceIcon,
	light: LightThemeIcon,
	dark: DarkThemeIcon,
	oled: OledThemeIcon,
}

const COLOR_PRESETS: ColorPresetConfig[] = [
	{ value: 'holidays', label: 'Holidays' },
	{ value: 'purple', label: 'Purple' },
	{ value: 'ocean', label: 'Ocean' },
	{ value: 'forest', label: 'Forest' },
	{ value: 'sunset', label: 'Sunset' },
	{ value: 'peanut', label: 'Peanut' },
]

/** Swatch colors from the Holidays design (slightly different from each scheme's primary) */
const HOLIDAY_SWATCHES: Record<Exclude<ColorPreset, 'holidays'>, string> = {
	purple: '#8B7CFF',
	ocean: '#4CC3F5',
	forest: '#3B6E3F',
	sunset: '#FF6E3A',
	peanut: '#B5552A',
}

function ThemeOptionCard({
	option,
	isSelected,
	onPress,
}: {
	option: ThemeOptionConfig
	isSelected: boolean
	onPress: () => void
}) {
	const isHolidays = useIsHolidays()
	const theme = useTheme()

	if (isHolidays) {
		const HolidayIcon = HOLIDAY_THEME_ICONS[option.value]

		return (
			<OptionCard
				label={option.label}
				selected={isSelected}
				onPress={onPress}
				leading={
					<HolidayIcon color={isSelected ? theme.primary.val : theme.borderColor.val} />
				}
			/>
		)
	}

	return (
		<XStack
			onPress={onPress}
			scale='1 press:0.97'
			borderWidth={1}
			borderColor={`${isSelected ? 'primary' : 'borderColor'}`}
			backgroundColor={`${isSelected ? 'background25' : 'background'}`}
			borderRadius='4'
			padding='2-5'
			alignItems='center'
			gap='2'
			flex={1}
			minWidth='45%'
		>
			<Icon size='7' name={option.icon} color={isSelected ? 'primary' : 'borderColor'} />
			<SizableText fontSize='2' fontWeight='6' flex={1}>
				{option.label}
			</SizableText>
			{isSelected && <Icon size='7' name='check-circle-outline' color='primary' />}
		</XStack>
	)
}

function ColorPresetCard({
	preset,
	isSelected,
	onPress,
}: {
	preset: ColorPresetConfig
	isSelected: boolean
	onPress: () => void
}) {
	const palette = PRESET_PALETTES[preset.value].dark
	const isHolidays = useIsHolidays()

	if (isHolidays) {
		return (
			<OptionCard
				label={preset.label}
				selected={isSelected}
				onPress={onPress}
				leading={
					preset.value === 'holidays' ? (
						<HolidaysSwatch size={24} />
					) : (
						<View
							style={{
								width: 24,
								height: 24,
								borderRadius: 12,
								backgroundColor: HOLIDAY_SWATCHES[preset.value],
							}}
						/>
					)
				}
			/>
		)
	}

	return (
		<XStack
			onPress={onPress}
			scale='1 press:0.97'
			borderWidth={1}
			borderColor={`${isSelected ? 'primary' : 'borderColor'}`}
			backgroundColor={`${isSelected ? 'background25' : 'background'}`}
			borderRadius='4'
			padding='2-5'
			alignItems='center'
			gap='2'
			flex={1}
			minWidth='45%'
		>
			{preset.value === 'holidays' ? (
				<HolidaysSwatch />
			) : (
				<YStack
					width={20}
					height={20}
					borderRadius={10}
					backgroundColor={palette.primary}
				/>
			)}
			<SizableText fontSize='2' fontWeight='6' flex={1}>
				{preset.label}
			</SizableText>
			{isSelected && <Icon size='7' name='check-circle-outline' color='primary' />}
		</XStack>
	)
}

export default function AppearanceScreen(): React.JSX.Element {
	const { bottom } = useSafeAreaInsets()
	const isHolidays = useIsHolidays()

	const {
		theme: themeSetting,
		setTheme: setThemeSetting,
		colorPreset,
		setColorPreset,
		hideRunTimes,
		setHideRunTimes,
		hideItemIndicators,
		setHideItemIndicators,
	} = useAppSettingsStore()

	return (
		<YStack flex={1} backgroundColor='background' testID='settings-screen-appearance'>
			<ScrollView
				contentContainerStyle={{ paddingBottom: Math.max(bottom, 16) + 16 }}
				showsVerticalScrollIndicator={false}
			>
				<YStack
					{...(isHolidays
						? { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 18 }
						: { padding: '4', gap: '6' })}
				>
					<YStack gap={isHolidays ? 14 : '3'}>
						<SizableText fontSize={isHolidays ? 17 : '3'} fontWeight='6'>
							Theme
						</SizableText>
						<XStack flexWrap='wrap' gap={isHolidays ? 8 : '2'}>
							{THEME_OPTIONS.map((option) => (
								<ThemeOptionCard
									key={option.value}
									option={option}
									isSelected={themeSetting === option.value}
									onPress={() => setThemeSetting(option.value)}
								/>
							))}
						</XStack>
					</YStack>

					<YStack gap={isHolidays ? 14 : '3'} marginTop={isHolidays ? 36 : undefined}>
						<SizableText fontSize={isHolidays ? 17 : '3'} fontWeight='6'>
							Color Scheme
						</SizableText>
						<XStack flexWrap='wrap' gap={isHolidays ? 8 : '2'}>
							{COLOR_PRESETS.map((preset) => (
								<ColorPresetCard
									key={preset.value}
									preset={preset}
									isSelected={colorPreset === preset.value}
									onPress={() => setColorPreset(preset.value)}
								/>
							))}
						</XStack>
					</YStack>

					<YStack gap={isHolidays ? 26 : '6'} marginTop={isHolidays ? 40 : undefined}>
						<XStack alignItems='center' justifyContent='space-between'>
							<YStack flex={1}>
								<SizableText fontSize={isHolidays ? 18 : '3'} fontWeight='6'>
									Hide Runtimes
								</SizableText>
								<SizableText fontSize={isHolidays ? 16 : '2'} color='borderColor'>
									Hide track duration lengths
								</SizableText>
							</YStack>
							{isHolidays ? (
								<HolidaySwitch
									checked={hideRunTimes}
									onCheckedChange={setHideRunTimes}
								/>
							) : (
								<SwitchWithLabel
									checked={hideRunTimes}
									onCheckedChange={setHideRunTimes}
									size='2'
								/>
							)}
						</XStack>

						<XStack alignItems='center' justifyContent='space-between'>
							<YStack flex={1}>
								<SizableText fontSize={isHolidays ? 18 : '3'} fontWeight='6'>
									Hide Card Indicators
								</SizableText>
								<SizableText fontSize={isHolidays ? 16 : '2'} color='borderColor'>
									Hide indicators on card corners
								</SizableText>
							</YStack>
							{isHolidays ? (
								<HolidaySwitch
									checked={hideItemIndicators}
									onCheckedChange={setHideItemIndicators}
								/>
							) : (
								<SwitchWithLabel
									checked={hideItemIndicators}
									onCheckedChange={setHideItemIndicators}
									size='2'
								/>
							)}
						</XStack>
					</YStack>
				</YStack>
			</ScrollView>
		</YStack>
	)
}
