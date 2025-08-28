import SettingsListGroup from './settings-list-group'
import { RadioGroup, YStack } from 'tamagui'
import { RadioGroupItemWithLabel } from '../../Global/helpers/radio-group-item-with-label'
import { Text } from '../../Global/helpers/text'
import {
	StreamingQuality,
	useSetStreamingQualityContext,
	useStreamingQualityContext,
} from '../../../providers/Settings'
import useStreamingDeviceProfile from '../../../stores/device-profile'
import { useDisplayAudioQualityBadge } from '../../../stores/player-settings'
import { SwitchWithLabel } from '../../Global/helpers/switch-with-label'

export default function PlaybackTab(): React.JSX.Element {
	const deviceProfile = useStreamingDeviceProfile()
	const streamingQuality = useStreamingQualityContext()
	const setStreamingQuality = useSetStreamingQualityContext()

	const [displayAudioQualityBadge, setDisplayAudioQualityBadge] = useDisplayAudioQualityBadge()

	return (
		<SettingsListGroup
			settingsList={[
				{
					title: 'Streaming Quality',
					subTitle: `${deviceProfile?.Name ?? 'Not set'}`,
					iconName: 'radio-tower',
					iconColor: '$borderColor',
					children: (
						<YStack gap='$2' paddingVertical='$2'>
							<Text fontSize='$3' marginBottom='$2'>
								Higher quality uses more bandwidth. Changes apply to new tracks.
							</Text>
							<RadioGroup
								value={streamingQuality}
								onValueChange={(value) =>
									setStreamingQuality(value as StreamingQuality)
								}
							>
								<RadioGroupItemWithLabel
									size='$3'
									value='original'
									label='Original Quality (Highest bandwidth)'
								/>
								<RadioGroupItemWithLabel
									size='$3'
									value='high'
									label='High (320kbps)'
								/>
								<RadioGroupItemWithLabel
									size='$3'
									value='medium'
									label='Medium (192kbps)'
								/>
								<RadioGroupItemWithLabel
									size='$3'
									value='low'
									label='Low (128kbps)'
								/>
							</RadioGroup>
						</YStack>
					),
				},
				{
					title: 'Show Audio Quality Badge',
					subTitle: 'Displays audio quality in the player',
					iconName: 'sine-wave',
					iconColor: '$borderColor',
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
