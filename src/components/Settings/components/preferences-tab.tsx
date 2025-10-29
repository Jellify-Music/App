import { RadioGroup, YStack, XStack, Paragraph, Button, SizableText } from 'tamagui'
import { SwitchWithLabel } from '../../Global/helpers/switch-with-label'
import SettingsListGroup from './settings-list-group'
import { RadioGroupItemWithLabel } from '../../Global/helpers/radio-group-item-with-label'
import {
	ThemeSetting,
	useReducedHapticsSetting,
	useSendMetricsSetting,
	useThemeSetting,
} from '../../../stores/settings/app'
import { useSwipeSettingsStore } from '../../../stores/settings/swipe'
import Icon from '../../Global/components/icon'

export default function PreferencesTab(): React.JSX.Element {
	const [sendMetrics, setSendMetrics] = useSendMetricsSetting()
	const [reducedHaptics, setReducedHaptics] = useReducedHapticsSetting()
	const [themeSetting, setThemeSetting] = useThemeSetting()
	const left = useSwipeSettingsStore((s) => s.left)
	const right = useSwipeSettingsStore((s) => s.right)
	const toggleLeft = useSwipeSettingsStore((s) => s.toggleLeft)
	const toggleRight = useSwipeSettingsStore((s) => s.toggleRight)

	const ActionChip = ({
		active,
		label,
		icon,
		onPress,
	}: {
		active: boolean
		label: string
		icon: string
		onPress: () => void
	}) => (
		<Button
			onPress={onPress}
			backgroundColor={active ? '$primary' : 'transparent'}
			borderColor={active ? '$primary' : '$borderColor'}
			borderWidth={'$0.5'}
			color={active ? '$background' : '$color'}
			paddingHorizontal={'$3'}
			size={'$2'}
			borderRadius={'$10'}
			icon={<Icon name={icon} color={active ? '$background' : '$color'} small />}
		>
			<SizableText size={'$2'}>{label}</SizableText>
		</Button>
	)

	return (
		<SettingsListGroup
			settingsList={[
				{
					title: 'Theme',
					subTitle: `Current: ${themeSetting}`,
					iconName: 'theme-light-dark',
					iconColor: `${themeSetting === 'system' ? '$borderColor' : '$primary'}`,
					children: (
						<YStack gap='$2' paddingVertical='$2'>
							<RadioGroup
								value={themeSetting}
								onValueChange={(value) => setThemeSetting(value as ThemeSetting)}
							>
								<RadioGroupItemWithLabel size='$3' value='system' label='System' />
								<RadioGroupItemWithLabel size='$3' value='light' label='Light' />
								<RadioGroupItemWithLabel size='$3' value='dark' label='Dark' />
							</RadioGroup>
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
								alignItems='center'
								justifyContent='space-between'
								gap={'$3'}
								paddingTop={'$2'}
							>
								<YStack gap={'$2'} flex={1}>
									<SizableText size={'$3'}>Swipe Left</SizableText>
									<XStack gap={'$2'} flexWrap='wrap'>
										<ActionChip
											active={left.includes('ToggleFavorite')}
											label='Favorite'
											icon='heart'
											onPress={() => toggleLeft('ToggleFavorite')}
										/>
										<ActionChip
											active={left.includes('AddToPlaylist')}
											label='Add to Playlist'
											icon='playlist-plus'
											onPress={() => toggleLeft('AddToPlaylist')}
										/>
										<ActionChip
											active={left.includes('AddToQueue')}
											label='Add to Queue'
											icon='playlist-play'
											onPress={() => toggleLeft('AddToQueue')}
										/>
									</XStack>
								</YStack>
								<YStack gap={'$2'} flex={1}>
									<SizableText size={'$3'}>Swipe Right</SizableText>
									<XStack gap={'$2'} flexWrap='wrap'>
										<ActionChip
											active={right.includes('ToggleFavorite')}
											label='Favorite'
											icon='heart'
											onPress={() => toggleRight('ToggleFavorite')}
										/>
										<ActionChip
											active={right.includes('AddToPlaylist')}
											label='Add to Playlist'
											icon='playlist-plus'
											onPress={() => toggleRight('AddToPlaylist')}
										/>
										<ActionChip
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
					title: 'Reduce Haptics',
					iconName: reducedHaptics ? 'vibrate-off' : 'vibrate',
					iconColor: reducedHaptics ? '$success' : '$borderColor',
					subTitle: 'Reduce haptic feedback',
					children: (
						<SwitchWithLabel
							checked={reducedHaptics}
							onCheckedChange={setReducedHaptics}
							size={'$2'}
							label={reducedHaptics ? 'Enabled' : 'Disabled'}
						/>
					),
				},
				{
					title: 'Send Metrics and Crash Reports',
					iconName: sendMetrics ? 'bug-check' : 'bug',
					iconColor: sendMetrics ? '$success' : '$borderColor',
					subTitle: 'Send anonymous usage and crash data',
					children: (
						<SwitchWithLabel
							checked={sendMetrics}
							onCheckedChange={setSendMetrics}
							size={'$2'}
							label={sendMetrics ? 'Enabled' : 'Disabled'}
						/>
					),
				},
			]}
		/>
	)
}
