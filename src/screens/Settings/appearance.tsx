import React from 'react'
import type { EventHandler } from '../../types/Events'
import type { Appearance, ColorPreset } from '../../types/theme'
import { YStack, XStack, SizableText, ScrollView, Separator } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import Icon from '../../components/Global/components/icon'
import { SwitchWithLabel } from '../../components/Global/utils/switch-with-label'
import { useAppSettingsStore } from '../../stores/settings/app'
import { PRESET_PALETTES } from '../../configs/styling/themes'
import { MaterialDesignIconsIconName } from '@react-native-vector-icons/material-design-icons'
import AppIconSettings from '../../components/Settings/components/settings/AppIcon'
import { Setting } from '../../components/Settings/components/sections'

type ThemeOptionConfig = {
	value: Appearance
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

const COLOR_PRESET_LABELS: ColorPresetConfig[] = [
	{ value: 'haze', label: 'Haze' },
	{ value: 'ocean', label: 'Ocean' },
	{ value: 'forest', label: 'Forest' },
	{ value: 'sunset', label: 'Sunset' },
	{ value: 'peanut', label: 'Peanut' },
]

function ThemeOptionCard({
	option,
	isSelected,
	onPress,
}: {
	option: ThemeOptionConfig
	isSelected: boolean
	onPress: EventHandler
}) {
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
	onPress: EventHandler
}) {
	const palette = PRESET_PALETTES[preset.value].dark

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
			<YStack width={20} height={20} borderRadius={10} backgroundColor={palette.primary} />
			<SizableText fontSize='2' fontWeight='6' flex={1}>
				{preset.label}
			</SizableText>
			{isSelected && <Icon size='7' name='check-circle-outline' color='primary' />}
		</XStack>
	)
}

export default function AppearanceScreen(): React.JSX.Element {
	const { bottom } = useSafeAreaInsets()

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
		<ScrollView
			contentContainerStyle={{ paddingBottom: Math.max(bottom, 16) + 16 }}
			showsVerticalScrollIndicator={false}
			testID='settings-screen-appearance'
			gap='2'
		>
			<Setting title='Theme' orientation='vertical'>
				<XStack flexWrap='wrap' gap='2'>
					{THEME_OPTIONS.map((option) => (
						<ThemeOptionCard
							key={option.value}
							option={option}
							isSelected={themeSetting === option.value}
							onPress={() => setThemeSetting(option.value)}
						/>
					))}
				</XStack>
			</Setting>

			<Separator borderColor='borderColor' />

			<Setting title='Color Scheme' orientation='vertical'>
				<XStack flexWrap='wrap' gap='2'>
					{COLOR_PRESET_LABELS.map((preset) => (
						<ColorPresetCard
							key={preset.value}
							preset={preset}
							isSelected={colorPreset === preset.value}
							onPress={() => setColorPreset(preset.value)}
						/>
					))}
				</XStack>
			</Setting>

			<Separator borderColor='borderColor' />

			<AppIconSettings />

			<Separator borderColor='borderColor' />

			<Setting
				title='Hide Runtimes'
				description='Hide track duration lengths'
				orientation='horizontal'
			>
				<SwitchWithLabel
					checked={hideRunTimes}
					onCheckedChange={setHideRunTimes}
					size='2'
				/>
			</Setting>

			<Separator borderColor='borderColor' />

			<Setting
				title='Hide Card Indicators'
				description='Hide indicators on card corners'
				orientation='horizontal'
			>
				<SwitchWithLabel
					checked={hideItemIndicators}
					onCheckedChange={setHideItemIndicators}
					size='2'
				/>
			</Setting>
		</ScrollView>
	)
}
