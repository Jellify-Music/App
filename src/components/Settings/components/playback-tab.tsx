import { SafeAreaView } from 'react-native-safe-area-context'
import SettingsListGroup from './settings-list-group'
import { RadioGroup, YStack } from 'tamagui'
import { RadioGroupItemWithLabel } from '../../Global/helpers/radio-group-item-with-label'
import { Text } from '../../Global/helpers/text'
import { useJellifyContext } from '../../../providers/index'
import { getQualityLabel, getBandwidthEstimate } from '../utils/quality'
import { StreamingQuality, useSettingsContext } from '../../../providers/Settings'

export default function PlaybackTab(): React.JSX.Element {
	const { server } = useJellifyContext()
	const { streamingQuality, setStreamingQuality } = useSettingsContext()

	return (
		<SettingsListGroup
			settingsList={[
				{
					title: 'Gapless Playback',
					subTitle: 'Seamless transitions between tracks',
					iconName: 'skip-next',
					iconColor: '$borderColor',
					children: (
						<Text fontSize='$3' color='$color10' padding='$3'>
							Gapless playback is automatically enabled for smooth music transitions.
						</Text>
					),
				},
				{
					title: 'Streaming Quality',
					subTitle: `Current: ${getQualityLabel(streamingQuality)} • ${getBandwidthEstimate(streamingQuality)}`,
					iconName: 'wifi',
					iconColor: '$primary',
					children: (
						<YStack gap='$2' paddingVertical='$2'>
							<Text bold fontSize='$4'>
								Streaming Quality:
							</Text>
							<Text fontSize='$3' color='$gray11' marginBottom='$2'>
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
