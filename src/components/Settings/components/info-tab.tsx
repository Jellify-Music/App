import { SafeAreaView } from 'react-native-safe-area-context'
import { getToken, ListItem, Progress, Separator, YGroup } from 'tamagui'
import Icon from '../../Global/components/icon'
import { version } from '../../../../package.json'
import { Text } from '../../Global/helpers/text'
import { useNetworkContext } from '../../../providers/Network'
import SettingsListGroup from './settings-list-group'

export default function InfoTab() {
	const { downloadedTracks, storageUsage } = useNetworkContext()

	return (
		<SafeAreaView>
			<SettingsListGroup
				settingsList={[
					{
						title: 'Storage',
						subTitle: `${downloadedTracks?.length ?? '0'} ${
							downloadedTracks?.length === 1 ? 'song' : 'songs'
						} in your pocket`,
						iconName: 'harddisk',
						iconColor: '$borderColor',
					},
					{
						title: `Jellify`,
						subTitle: version,
						iconName: 'jellyfish',
						iconColor: '$borderColor',
						children: <Text>Made with 💜 by Violet Caulfield</Text>,
					},
				]}
			/>
		</SafeAreaView>
	)
}
