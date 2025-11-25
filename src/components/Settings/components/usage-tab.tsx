import SettingsListGroup from './settings-list-group'
import { SwitchWithLabel } from '../../Global/helpers/switch-with-label'
import { RadioGroupItemWithLabel } from '../../Global/helpers/radio-group-item-with-label'
import { RadioGroup } from 'tamagui'
import { useAllDownloadedTracks } from '../../../api/queries/download'
import {
	DownloadQuality,
	useAutoDownload,
	useDownloadQuality,
} from '../../../stores/settings/usage'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { SettingsStackParamList } from '../../../screens/Settings/types'
export default function StorageTab(): React.JSX.Element {
	const [autoDownload, setAutoDownload] = useAutoDownload()
	const [downloadQuality, setDownloadQuality] = useDownloadQuality()

	const { data: downloadedTracks } = useAllDownloadedTracks()
	const navigation =
		useNavigation<NativeStackNavigationProp<SettingsStackParamList, 'Settings'>>()

	return (
		<SettingsListGroup
			settingsList={[
				{
					title: 'Downloaded Tracks',
					subTitle: `${downloadedTracks?.length ?? '0'} ${
						downloadedTracks?.length === 1 ? 'song' : 'songs'
					} stored offline · tap to manage`,
					iconName: 'harddisk',
					iconColor: '$primary',
					onPress: () => navigation.navigate('StorageManagement'),
				},
				{
					title: 'Auto-Download Tracks',
					subTitle: 'Download tracks as they are played',
					iconName: autoDownload ? 'cloud-download' : 'cloud-off-outline',
					iconColor: autoDownload ? '$success' : '$borderColor',
					children: (
						<SwitchWithLabel
							size={'$2'}
							label={autoDownload ? 'Downloading' : 'Disabled'}
							checked={autoDownload}
							onCheckedChange={() => setAutoDownload(!autoDownload)}
						/>
					),
				},
				{
					title: 'Download Quality',
					subTitle: `Quality used when downloading tracks`,
					iconName: 'file-download',
					iconColor: '$primary',
					children: (
						<RadioGroup
							value={downloadQuality}
							onValueChange={(value) => setDownloadQuality(value as DownloadQuality)}
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
							<RadioGroupItemWithLabel size='$3' value='low' label='Low (128kbps)' />
						</RadioGroup>
					),
				},
			]}
		/>
	)
}
