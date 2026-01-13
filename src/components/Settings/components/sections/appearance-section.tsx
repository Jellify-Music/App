import React from 'react'
import { XStack, YStack, SizableText } from 'tamagui'

import SettingsSection from '../settings-section'
import Icon from '../../../Global/components/icon'
import { SwitchWithLabel } from '../../../Global/helpers/switch-with-label'
import {
	ThemeSetting,
	useHideRunTimesSetting,
	useThemeSetting,
} from '../../../../stores/settings/app'

type ThemeOptionConfig = {
	value: ThemeSetting
	label: string
	icon: string
}

const THEME_OPTIONS: ThemeOptionConfig[] = [
	{ value: 'system', label: 'Match Device', icon: 'theme-light-dark' },
	{ value: 'light', label: 'Light', icon: 'white-balance-sunny' },
	{ value: 'dark', label: 'Dark', icon: 'weather-night' },
	{ value: 'oled', label: 'OLED Black', icon: 'invert-colors' },
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

export default function AppearanceSection(): React.JSX.Element {
	const [themeSetting, setThemeSetting] = useThemeSetting()
	const [hideRunTimes, setHideRunTimes] = useHideRunTimesSetting()

	return (
		<SettingsSection title='Appearance' icon='palette' iconColor='$primary' defaultExpanded>
			<YStack gap='$2'>
				<SizableText size='$3' color='$borderColor'>
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
		</SettingsSection>
	)
}
