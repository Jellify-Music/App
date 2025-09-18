import SettingsListGroup from './settings-list-group'
import { RadioGroup } from 'tamagui'
import { RadioGroupItemWithLabel } from '../../Global/helpers/radio-group-item-with-label'
import { useDisplayAudioQualityBadge, useStreamingQuality } from '../../../stores/settings/player'
import { SwitchWithLabel } from '../../Global/helpers/switch-with-label'
import StreamingQuality from '../../../enums/audio-quality'

export default function PlaybackTab(): React.JSX.Element {
	const [streamingQuality, setStreamingQuality] = useStreamingQuality()

	const [displayAudioQualityBadge, setDisplayAudioQualityBadge] = useDisplayAudioQualityBadge()

	return (
		<SettingsListGroup
			settingsList={[
				{
					title: 'Streaming Quality',
					subTitle: `Changes apply to new tracks`,
					iconName: 'radio-tower',
					iconColor:
						streamingQuality === StreamingQuality.Original ? '$primary' : '$danger',
					children: (
						<RadioGroup
							value={streamingQuality}
							onValueChange={(value) =>
								setStreamingQuality(value as StreamingQuality)
							}
						>
							<RadioGroupItemWithLabel
								size='$3'
								value={StreamingQuality.Original}
								label='Original Quality (Highest bandwidth)'
							/>
							<RadioGroupItemWithLabel
								size='$3'
								value={StreamingQuality.High}
								label='High (320kbps)'
							/>
							<RadioGroupItemWithLabel
								size='$3'
								value={StreamingQuality.Medium}
								label='Medium (192kbps)'
							/>
							<RadioGroupItemWithLabel
								size='$3'
								value={StreamingQuality.Low}
								label='Low (128kbps)'
							/>
						</RadioGroup>
					),
				},
				{
					title: 'Show Audio Quality Badge',
					subTitle: 'Displays audio quality in the player',
					iconName: 'sine-wave',
					iconColor: displayAudioQualityBadge ? '$success' : '$borderColor',
					children: (
						<SwitchWithLabel
							onCheckedChange={setDisplayAudioQualityBadge}
							size={'$2'}
							checked={displayAudioQualityBadge}
							label={displayAudioQualityBadge ? 'Enabled' : 'Disabled'}
						/>
					),
				},
			]}
		/>
	)
}

function getStreamingQualityIconColor(streamingQuality: StreamingQuality): string {
	switch (streamingQuality) {
		case 'original':
			return '$success'
		case 'high':
			return '$success'
		case 'medium':
			return '$secondary'
		case 'low':
			return '$danger'
		default:
			return '$borderColor'
	}
}
