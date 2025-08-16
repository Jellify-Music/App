import { RadioGroup, YStack } from 'tamagui'
import {
	Theme,
	useReducedHapticsContext,
	useSendMetricsContext,
	useSetReducedHapticsContext,
	useSetSendMetricsContext,
	useSetThemeSettingContext,
	useThemeSettingContext,
} from '../../../providers/Settings'
import { SwitchWithLabel } from '../../Global/helpers/switch-with-label'
import SettingsListGroup from './settings-list-group'
import { RadioGroupItemWithLabel } from '../../Global/helpers/radio-group-item-with-label'

export default function PreferencesTab(): React.JSX.Element {
	const setSendMetrics = useSetSendMetricsContext()
	const sendMetrics = useSendMetricsContext()
	const setReducedHaptics = useSetReducedHapticsContext()
	const reducedHaptics = useReducedHapticsContext()
	const themeSetting = useThemeSettingContext()
	const setThemeSetting = useSetThemeSettingContext()

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
								onValueChange={(value) => setThemeSetting(value as Theme)}
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
