import { RadioGroup, YStack } from 'tamagui'
import { Theme, useSettingsContext } from '../../../providers/Settings'
import { SwitchWithLabel } from '../../Global/helpers/switch-with-label'
import SettingsListGroup from './settings-list-group'
import { RadioGroupItemWithLabel } from '../../Global/helpers/radio-group-item-with-label'
import { Text } from '../../Global/helpers/text'

export default function PreferencesTab(): React.JSX.Element {
	const { setSendMetrics, sendMetrics, setReducedHaptics, reducedHaptics, theme, setTheme } =
		useSettingsContext()
	return (
		<SettingsListGroup
			settingsList={[
				{
					title: 'Theme',
					subTitle: `Current: ${theme}`,
					iconName: 'theme-light-dark',
					iconColor: `${theme === 'system' ? '$borderColor' : '$primary'}`,
					children: (
						<YStack gap='$2' paddingVertical='$2'>
							<RadioGroup
								value={theme}
								onValueChange={(value) => setTheme(value as Theme)}
							>
								<RadioGroupItemWithLabel size='$3' value='system' label='System' />
								<RadioGroupItemWithLabel size='$3' value='light' label='Light' />
								<RadioGroupItemWithLabel size='$3' value='dark' label='Dark' />
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
			]}
		/>
	)
}
