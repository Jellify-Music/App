import { useSettingsContext } from '../../../providers/Settings'
import { SwitchWithLabel } from '../../Global/helpers/switch-with-label'
import SettingsListGroup from './settings-list-group'

export default function PreferencesTab(): React.JSX.Element {
	const { setSendMetrics, sendMetrics } = useSettingsContext()
	return (
		<SettingsListGroup
			settingsList={[
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
