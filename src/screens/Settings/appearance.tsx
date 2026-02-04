import React from 'react'
import { YStack, XStack, SizableText, ScrollView } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import Icon from '../../components/Global/components/icon'
import { SwitchWithLabel } from '../../components/Global/helpers/switch-with-label'
import {
	ColorPreset,
	ThemeSetting,
	useColorPresetSetting,
	useHideRunTimesSetting,
	useThemeSetting,
} from '../../stores/settings/app'
import { PRESET_PALETTES } from '../../../tamagui.config'

type ThemeOptionConfig = {
	value: ThemeSetting
	label: string
	icon: string
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

const COLOR_PRESETS: ColorPresetConfig[] = [
	{ value: 'purple', label: 'Purple' },
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
	onPress: () => void
}) {
	return (
		<XStack
			onPress={onPress}
			pressStyle={{ scale: 0.97 }}
			animation='quick'
			borderWidth='$1'
			borderColor={isSelected ? '$primary' : '$borderColor'}
			backgroundColor={isSelected ? '$background25' : '$background'}
			borderRadius='$4'
			padding='$2.5'
			alignItems='center'
			gap='$2'
			flex={1}
			minWidth='45%'
		>
			<Icon small name={option.icon} color={isSelected ? '$primary' : '$borderColor'} />
			<SizableText size='$3' fontWeight='600' flex={1}>
				{option.label}
			</SizableText>
			{isSelected && <Icon small name='check-circle-outline' color='$primary' />}
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

	return (
		<XStack
			onPress={onPress}
			pressStyle={{ scale: 0.97 }}
			animation='quick'
			borderWidth='$1'
			borderColor={isSelected ? '$primary' : '$borderColor'}
			backgroundColor={isSelected ? '$background25' : '$background'}
			borderRadius='$4'
			padding='$2.5'
			alignItems='center'
			gap='$2'
			flex={1}
			minWidth='45%'
		>
			<YStack width={20} height={20} borderRadius={10} backgroundColor={palette.primary} />
			<SizableText size='$3' fontWeight='600' flex={1}>
				{preset.label}
			</SizableText>
			{isSelected && <Icon small name='check-circle-outline' color='$primary' />}
		</XStack>
	)
}

export default function AppearanceScreen(): React.JSX.Element {
	const { bottom } = useSafeAreaInsets()
	const [themeSetting, setThemeSetting] = useThemeSetting()
	const [colorPreset, setColorPreset] = useColorPresetSetting()
	const [hideRunTimes, setHideRunTimes] = useHideRunTimesSetting()

	return (
		<YStack flex={1} backgroundColor='$background'>
			<ScrollView
				contentContainerStyle={{ paddingBottom: Math.max(bottom, 16) + 16 }}
				showsVerticalScrollIndicator={false}
			>
				<YStack padding='$4' gap='$6'>
					<YStack gap='$3'>
						<SizableText size='$4' fontWeight='600' color='$borderColor'>
							Theme
						</SizableText>
						<XStack flexWrap='wrap' gap='$2'>
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

					<YStack gap='$3'>
						<SizableText size='$4' fontWeight='600' color='$borderColor'>
							Color Scheme
						</SizableText>
						<XStack flexWrap='wrap' gap='$2'>
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

					<XStack alignItems='center' justifyContent='space-between'>
						<YStack flex={1}>
							<SizableText size='$4'>Hide Runtimes</SizableText>
							<SizableText size='$2' color='$borderColor'>
								Hide track duration lengths
							</SizableText>
						</YStack>
						<SwitchWithLabel
							checked={hideRunTimes}
							onCheckedChange={setHideRunTimes}
							size='$2'
							label=''
						/>
					</XStack>
				</YStack>
			</ScrollView>
		</YStack>
	)
}
