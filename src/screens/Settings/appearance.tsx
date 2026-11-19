import React from 'react'
import type { EventHandler } from '../../types/Events'
import type { Appearance, ColorPreset } from '../../types/theme'
import { YStack, XStack, SizableText, ScrollView } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import Icon from '../../components/Global/components/icon'
import { SwitchWithLabel } from '../../components/Global/utils/switch-with-label'
import { useAppSettingsStore } from '../../stores/settings/app'
import { PRESET_PALETTES } from '../../configs/styling/themes'
import { MaterialDesignIconsIconName } from '@react-native-vector-icons/material-design-icons'
import AppIconSettings from '../../components/Settings/components/settings/AppIcon'
import { useTranslation } from 'react-i18next'

type ThemeOptionConfig = {
	value: Appearance
	icon: MaterialDesignIconsIconName
}

type ColorPresetConfig = {
	value: ColorPreset
}

const THEME_OPTIONS: ThemeOptionConfig[] = [
	{ value: 'system', icon: 'theme-light-dark' },
	{ value: 'light', icon: 'white-balance-sunny' },
	{ value: 'dark', icon: 'weather-night' },
	{ value: 'oled', icon: 'invert-colors' },
]

const COLOR_PRESET_OPTIONS: ColorPresetConfig[] = [
	{ value: 'haze' },
	{ value: 'ocean' },
	{ value: 'forest' },
	{ value: 'sunset' },
	{ value: 'peanut' },
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
	const { t } = useTranslation()

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
				{t(`settings.appearance.themes.${option.value}`)}
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
	const { t } = useTranslation()

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
				{t(`settings.appearance.colorPresets.${preset.value}`)}
			</SizableText>
			{isSelected && <Icon size='7' name='check-circle-outline' color='primary' />}
		</XStack>
	)
}

export default function AppearanceScreen(): React.JSX.Element {
	const { t } = useTranslation()

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
		<YStack flex={1} backgroundColor='background' testID='settings-screen-appearance'>
			<ScrollView
				contentContainerStyle={{ paddingBottom: Math.max(bottom, 16) + 16 }}
				showsVerticalScrollIndicator={false}
			>
				<YStack padding='4' gap='6'>
					<YStack gap='3'>
						<SizableText fontSize='3' fontWeight='6'>
							{t('settings.appearance.theme')}
						</SizableText>
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
					</YStack>

					<YStack gap='3'>
						<SizableText fontSize='3' fontWeight='6'>
							{t('settings.appearance.colorScheme')}
						</SizableText>
						<XStack flexWrap='wrap' gap='2'>
							{COLOR_PRESET_OPTIONS.map((preset) => (
								<ColorPresetCard
									key={preset.value}
									preset={preset}
									isSelected={colorPreset === preset.value}
									onPress={() => setColorPreset(preset.value)}
								/>
							))}
						</XStack>
					</YStack>

					<AppIconSettings />

					<XStack alignItems='center' justifyContent='space-between'>
						<YStack flex={1}>
							<SizableText fontSize='3' fontWeight='6'>
								{t('settings.appearance.hideRuntimes')}
							</SizableText>
							<SizableText fontSize='2' color='borderColor'>
								{t('settings.appearance.hideRuntimesDescription')}
							</SizableText>
						</YStack>
						<SwitchWithLabel
							checked={hideRunTimes}
							onCheckedChange={setHideRunTimes}
							size='2'
						/>
					</XStack>

					<XStack alignItems='center' justifyContent='space-between'>
						<YStack flex={1}>
							<SizableText fontSize='3' fontWeight='6'>
								{t('settings.appearance.hideCardIndicators')}
							</SizableText>
							<SizableText fontSize='2' color='borderColor'>
								{t('settings.appearance.hideCardIndicatorsDescription')}
							</SizableText>
						</YStack>
						<SwitchWithLabel
							checked={hideItemIndicators}
							onCheckedChange={setHideItemIndicators}
							size='2'
						/>
					</XStack>
				</YStack>
			</ScrollView>
		</YStack>
	)
}
