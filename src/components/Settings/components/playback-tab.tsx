import { SafeAreaView } from 'react-native-safe-area-context'
import SettingsListGroup from './settings-list-group'
import { Text } from 'tamagui'

export default function PlaybackTab(): React.JSX.Element {
	return (
		<SafeAreaView>
			<SettingsListGroup
				settingsList={[
					{
						title: 'Gapless Playback',
						subTitle: 'Seamless transitions between tracks',
						iconName: 'skip-next',
						iconColor: '$borderColor',
						children: (
							<Text fontSize='$3' color='$color10' padding='$3'>
								Gapless playback is automatically enabled for smooth music
								transitions.
							</Text>
						),
					},
				]}
			/>
		</SafeAreaView>
	)
}
