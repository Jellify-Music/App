import { RadioGroup, YStack } from 'tamagui'
import { SwitchWithLabel } from '../../Global/helpers/switch-with-label'
import SettingsListGroup from './settings-list-group'
import { RadioGroupItemWithLabel } from '../../Global/helpers/radio-group-item-with-label'
import Button from '../../Global/helpers/button'
import Icon from '../../Global/components/icon'
import { Text } from '../../Global/helpers/text'
import { downloadUpdate } from '../../OtaUpdates'
import {
	ThemeSetting,
	useReducedHapticsSetting,
	useSendMetricsSetting,
	useThemeSetting,
} from '../../../stores/settings/app'

export default function PreferencesTab(): React.JSX.Element {
	const [sendMetrics, setSendMetrics] = useSendMetricsSetting()
	const [reducedHaptics, setReducedHaptics] = useReducedHapticsSetting()
	const [themeSetting, setThemeSetting] = useThemeSetting()

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
								<RadioGroupItemWithLabel
									size='$3'
									value='oled'
									label='OLED (True Black)'
								/>
							</RadioGroup>
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

				{
					title: 'Forcefully download the latest OTA',
					iconName: 'web',
					iconColor: '$success',
					subTitle: 'Download the latest ota forcefully',
					children: (
						<Button
							variant='outlined'
							color={'$success'}
							borderColor={'$success'}
							icon={() => <Icon name='download' small color={'$success'} />}
							onPress={() => downloadUpdate(true)}
						>
							<Text bold color={'$success'}>
								Download Update
							</Text>
						</Button>
					),
				},
			]}
		/>
	)
}
