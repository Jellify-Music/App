import SettingsListGroup from './settings-list-group'
import { SwitchWithLabel } from '../../Global/helpers/switch-with-label'
import { RadioGroupItemWithLabel } from '../../Global/helpers/radio-group-item-with-label'
import { useSettingsContext, DownloadQuality } from '../../../providers/Settings'
import { useNetworkContext } from '../../../providers/Network'
import { RadioGroup, YStack } from 'tamagui'
import { Text } from '../../Global/helpers/text'
import { getQualityLabel } from '../utils/quality'
export default function StorageTab(): React.JSX.Element {
	const { autoDownload, setAutoDownload, downloadQuality, setDownloadQuality } =
		useSettingsContext()
	const { downloadedTracks } = useNetworkContext()

	return (
		<SettingsListGroup
			settingsList={[
				{
					title: 'Downloaded Tracks',
					subTitle: `${downloadedTracks?.length ?? '0'} ${
						downloadedTracks?.length === 1 ? 'song' : 'songs'
					} in your pocket`,
					iconName: 'harddisk',
					iconColor: '$borderColor',
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
					iconName: 'file-download',
					iconColor: '$primary',
					children: (
						<YStack gap='$2' paddingVertical='$2'>
							<Text fontSize='$3' marginBottom='$2'>
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
