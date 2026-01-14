import { YStack, XStack, Paragraph, SizableText } from 'tamagui'
import { SwitchWithLabel } from '../../Global/helpers/switch-with-label'
import SettingsListGroup from './settings-list-group'
import {
	ThemeSetting,
	useHideRunTimesSetting,
	useReducedHapticsSetting,
	useSendMetricsSetting,
	useThemeSetting,
} from '../../../stores/settings/app'
import { useSwipeSettingsStore } from '../../../stores/settings/swipe'
import Button from '../../Global/helpers/button'
import Icon from '../../Global/components/icon'

type ThemeOptionConfig = {
	value: ThemeSetting
	label: string
	icon: string
}

const THEME_OPTIONS: ThemeOptionConfig[] = [
	{
		value: 'system',
		label: 'Match Device',
		icon: 'theme-light-dark',
	},
	{
		value: 'light',
		label: 'Light',
		icon: 'white-balance-sunny',
	},
	{
		value: 'dark',
		label: 'Dark',
		icon: 'weather-night',
	},
	{
		value: 'oled',
		label: 'OLED Black',
		icon: 'invert-colors',
	},
]

function ActionChip({
	active,
	label,
	icon,
	onPress,
	testID,
}: {
	active: boolean
	label: string
	icon: string
	onPress: () => void
	testID?: string
}) {
	return (
		<Button
			testID={testID}
			pressStyle={{
				backgroundColor: '$neutral',
			}}
			onPress={onPress}
			backgroundColor={active ? '$success' : 'transparent'}
			borderColor={active ? '$success' : '$borderColor'}
			borderWidth={'$0.5'}
			color={active ? '$background' : '$color'}
			paddingHorizontal={'$3'}
			size={'$2'}
			borderRadius={'$10'}
			icon={<Icon name={icon} color={active ? '$background' : '$color'} small />}
		>
			<SizableText color={active ? '$background' : '$color'} size={'$2'}>
				{label}
			</SizableText>
		</Button>
	)
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
	return (
		<YStack
			onPress={onPress}
			pressStyle={{ scale: 0.97 }}
			animation='quick'
			borderWidth={'$1'}
			borderColor={isSelected ? '$primary' : '$borderColor'}
			backgroundColor={isSelected ? '$background25' : '$background'}
			borderRadius={'$9'}
			padding='$3'
			gap='$2'
			hitSlop={8}
			role='button'
			aria-label={`${option.label} theme option`}
			aria-selected={isSelected}
		>
			<XStack alignItems='center' gap='$2'>
				<Icon small name={option.icon} color={isSelected ? '$primary' : '$borderColor'} />
				<SizableText size={'$4'} flex={1} fontWeight='600'>
					{option.label}
				</SizableText>
				{isSelected && <Icon small name='check-circle-outline' color={'$primary'} />}
			</XStack>
		</YStack>
	)
}

function getThemeSubtitle(themeSetting: ThemeSetting): string {
	switch (themeSetting) {
		case 'light':
			return 'You crazy diamond'
		case 'dark':
			return "There's a dark side??"
		case 'oled':
			return 'Back in black'
		default:
			return "I'm down with this system"
	}
}

export default function PreferencesTab(): React.JSX.Element {
	const [sendMetrics, setSendMetrics] = useSendMetricsSetting()
	const [reducedHaptics, setReducedHaptics] = useReducedHapticsSetting()
	const [themeSetting, setThemeSetting] = useThemeSetting()
	const [hideRunTimes, setHideRunTimes] = useHideRunTimesSetting()

	const left = useSwipeSettingsStore((s) => s.left)
	const right = useSwipeSettingsStore((s) => s.right)
	const toggleLeft = useSwipeSettingsStore((s) => s.toggleLeft)
	const toggleRight = useSwipeSettingsStore((s) => s.toggleRight)

	const themeSubtitle = getThemeSubtitle(themeSetting)

	return (
		<SettingsListGroup
			settingsList={[
				{
					title: 'Theme',
					subTitle: themeSubtitle && `${themeSubtitle}`,
					iconName: 'theme-light-dark',
					iconColor: `${themeSetting === 'system' ? '$borderColor' : '$primary'}`,
					children: (
						<YStack gap='$2' paddingVertical='$2'>
							{THEME_OPTIONS.map((option) => (
								<ThemeOptionCard
									key={option.value}
									option={option}
									isSelected={themeSetting === option.value}
									onPress={() => setThemeSetting(option.value)}
								/>
							))}
						</YStack>
					),
				},
				{
					title: 'Track Swipe Actions',
					subTitle: 'Choose actions for left/right swipes',
					iconName: 'gesture-swipe',
					iconColor: '$borderColor',
					children: (
						<YStack gap={'$2'} paddingVertical={'$2'}>
							<Paragraph color={'$borderColor'}>
								Single selection triggers on reveal; multiple selections show a
								menu.
							</Paragraph>
							<XStack
								alignItems='flex-start'
								justifyContent='space-between'
								gap={'$3'}
								paddingTop={'$2'}
								flexWrap='wrap'
							>
								<YStack gap={'$2'} flex={1} flexBasis='48%' minWidth={240}>
									<SizableText size={'$3'}>Swipe Left</SizableText>
									<XStack gap={'$2'} flexWrap='wrap'>
										<ActionChip
											testID='swipe-left-favorite-toggle'
											active={left.includes('ToggleFavorite')}
											label='Favorite'
											icon='heart'
											onPress={() => toggleLeft('ToggleFavorite')}
										/>
										<ActionChip
											testID='swipe-left-playlist-toggle'
											active={left.includes('AddToPlaylist')}
											label='Add to Playlist'
											icon='playlist-plus'
											onPress={() => toggleLeft('AddToPlaylist')}
										/>
										<ActionChip
											testID='swipe-left-queue-toggle'
											active={left.includes('AddToQueue')}
											label='Add to Queue'
											icon='playlist-play'
											onPress={() => toggleLeft('AddToQueue')}
										/>
									</XStack>
								</YStack>
								<YStack gap={'$2'} flex={1} flexBasis='48%' minWidth={240}>
									<SizableText size={'$3'}>Swipe Right</SizableText>
									<XStack gap={'$2'} flexWrap='wrap'>
										<ActionChip
											testID='swipe-right-favorite-toggle'
											active={right.includes('ToggleFavorite')}
											label='Favorite'
											icon='heart'
											onPress={() => toggleRight('ToggleFavorite')}
										/>
										<ActionChip
											testID='swipe-right-playlist-toggle'
											active={right.includes('AddToPlaylist')}
											label='Add to Playlist'
											icon='playlist-plus'
											onPress={() => toggleRight('AddToPlaylist')}
										/>
										<ActionChip
											testID='swipe-right-queue-toggle'
											active={right.includes('AddToQueue')}
											label='Add to Queue'
											icon='playlist-play'
											onPress={() => toggleRight('AddToQueue')}
										/>
									</XStack>
								</YStack>
							</XStack>
						</YStack>
					),
				},
				{
					title: 'Hide Runtimes',
					iconName: 'clock-digital',
					iconColor: hideRunTimes ? '$success' : '$borderColor',
					subTitle: 'Hides track runtime lengths',
					children: (
						<SwitchWithLabel
							checked={hideRunTimes}
							onCheckedChange={setHideRunTimes}
							size={'$2'}
							label={hideRunTimes ? 'Hidden' : 'Shown'}
						/>
					),
				},
				{
					title: 'Reduce Haptics',
					iconName: reducedHaptics ? 'vibrate-off' : 'vibrate',
					iconColor: reducedHaptics ? '$success' : '$borderColor',
					subTitle: 'Reduce haptic feedback',
					children: (
						<SwitchWithLabel
							checked={reducedHaptics}
							onCheckedChange={setReducedHaptics}
							size={'$2'}
							label={reducedHaptics ? 'Reduced' : 'Disabled'}
						/>
					),
				},
				{
					title: 'Send Analytics',
					iconName: sendMetrics ? 'bug-check' : 'bug',
					iconColor: sendMetrics ? '$success' : '$borderColor',
					subTitle: 'Send usage and crash data',
					children: (
						<SwitchWithLabel
							checked={sendMetrics}
							onCheckedChange={setSendMetrics}
							size={'$2'}
							label={sendMetrics ? 'Sending' : 'Disabled'}
						/>
					),
				},
			]}
		/>
	)
}
