import SettingsListGroup from './settings-list-group'
import { SwitchWithLabel } from '../../Global/helpers/switch-with-label'
import { RadioGroupItemWithLabel } from '../../Global/helpers/radio-group-item-with-label'
import { useSettingsContext, DownloadQuality, StreamingQuality } from '../../../providers/Settings'
import { useNetworkContext } from '../../../providers/Network'
import { RadioGroup, YStack } from 'tamagui'
import { Text } from '../../Global/helpers/text'

export default function StorageTab(): React.JSX.Element {
	const {
		autoDownload,
		setAutoDownload,
		downloadQuality,
		setDownloadQuality,
		streamingQuality,
		setStreamingQuality,
	} = useSettingsContext()
	const { downloadedTracks, storageUsage } = useNetworkContext()

	const getQualityLabel = (quality: string) => {
		switch (quality) {
			case 'original':
				return 'Original Quality'
			case 'high':
				return 'High (320kbps)'
			case 'medium':
				return 'Medium (192kbps)'
			case 'low':
				return 'Low (128kbps)'
			default:
				return 'Medium (192kbps)'
		}
	}

	const getBandwidthEstimate = (quality: string) => {
		switch (quality) {
			case 'original':
				return 'Varies (highest bandwidth)'
			case 'high':
				return '~2.4 MB/min'
			case 'medium':
				return '~1.4 MB/min'
			case 'low':
				return '~1.0 MB/min'
			default:
				return '~1.4 MB/min'
		}
	}

	return (
		<SettingsListGroup
			settingsList={[
				{
					title: 'Usage',
					subTitle: `${downloadedTracks?.length ?? '0'} ${
						downloadedTracks?.length === 1 ? 'song' : 'songs'
					} in your pocket`,
					iconName: 'harddisk',
					iconColor: '$borderColor',
				},
				{
					title: 'Streaming Quality',
					subTitle: `Current: ${getQualityLabel(streamingQuality)} • ${getBandwidthEstimate(streamingQuality)}`,
					iconName: 'wifi',
					iconColor: '$blue10',
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
				{
					title: 'Automatically Cache Tracks',
					subTitle: 'Download tracks as they are played',
					iconName: autoDownload ? 'cloud-download' : 'cloud-off-outline',
					iconColor: autoDownload ? '$success' : '$borderColor',
					children: (
						<SwitchWithLabel
							size={'$2'}
							label={autoDownload ? 'Enabled' : 'Disabled'}
							checked={autoDownload}
							onCheckedChange={() => setAutoDownload(!autoDownload)}
						/>
					),
				},
				{
					title: 'Download Quality',
					subTitle: `Current: ${getQualityLabel(downloadQuality)} • For offline tracks`,
					iconName: 'music-note',
					iconColor: '$borderColor',
					children: (
						<YStack gap='$2' paddingVertical='$2'>
							<Text bold fontSize='$4'>
								Download Quality:
							</Text>
							<Text fontSize='$3' color='$gray11' marginBottom='$2'>
								Quality used when saving tracks for offline use.
							</Text>
							<RadioGroup
								value={downloadQuality}
								onValueChange={(value) =>
									setDownloadQuality(value as DownloadQuality)
								}
							>
								<RadioGroupItemWithLabel
									size='$3'
									value='original'
									label='Original Quality'
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
