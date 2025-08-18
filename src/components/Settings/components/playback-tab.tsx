import SettingsListGroup from './settings-list-group'
import { RadioGroup, YStack } from 'tamagui'
import { RadioGroupItemWithLabel } from '../../Global/helpers/radio-group-item-with-label'
import { Text } from '../../Global/helpers/text'
import { getQualityLabel, getBandwidthEstimate } from '../utils/quality'
import {
	StreamingQuality,
	useSetStreamingQualityContext,
	useStreamingQualityContext,
} from '../../../providers/Settings'

export default function PlaybackTab(): React.JSX.Element {
	const streamingQuality = useStreamingQualityContext()
	const setStreamingQuality = useSetStreamingQualityContext()

	return (
		<SettingsListGroup
			settingsList={[
				{
					title: 'Streaming Quality',
					subTitle: `Current: ${getQualityLabel(streamingQuality)} • ${getBandwidthEstimate(streamingQuality)}`,
					iconName: 'sine-wave',
					iconColor: getStreamingQualityIconColor(streamingQuality),
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
