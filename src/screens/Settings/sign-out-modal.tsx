import { XStack, YStack } from 'tamagui'
import { SettingsStackParamList } from './types'
import { H5, Text } from '../../components/Global/helpers/text'
import Button from '../../components/Global/helpers/button'
import Icon from '../../components/Global/components/icon'
import { useResetQueue } from '../../hooks/player/callbacks'
import { useJellifyServer } from '../../stores/auth'
import { CommonActions, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { DownloadManager, TrackPlayer } from 'react-native-nitro-player'
import navigationRef from '../navigation'

export default function SignOutModal(): React.JSX.Element {
	const [server] = useJellifyServer()

	const settingsStackNavigation =
		useNavigation<NativeStackNavigationProp<SettingsStackParamList>>()

	const resetQueue = useResetQueue()
	const clearDownloads = async () => {
		await DownloadManager.deleteAllDownloads()
	}

	const onSignOut = async () => {
		await TrackPlayer.pause()

		settingsStackNavigation.goBack()

		navigationRef.dispatch(
			CommonActions.navigate({
				name: 'Login',
				params: {
					screen: 'ServerAddress',
				},
			}),
		)

		navigationRef.dispatch(
			CommonActions.reset({
				index: 0,
				routes: [{ name: 'Login', params: { screen: 'ServerAddress' } }],
			}),
		)

		await clearDownloads()
		resetQueue()
	}

	return (
		<YStack margin={'$6'}>
			<H5>{`Sign out of ${server?.name ?? 'Jellyfin'}?`}</H5>
			<XStack gap={'$2'}>
				<Button
					icon={() => <Icon name='chevron-left' small color={'$borderColor'} />}
					borderWidth={'$1'}
					borderColor={'$borderColor'}
					flex={1}
					onPress={settingsStackNavigation.goBack}
				>
					<Text bold color={'$borderColor'}>
						Cancel
					</Text>
				</Button>
				<Button
					testID='sign-out-button'
					flex={1}
					icon={() => <Icon name='logout' small color={'$danger'} />}
					borderColor={'$danger'}
					onPress={onSignOut}
				>
					<Text bold color={'$danger'}>
						Sign out
					</Text>
				</Button>
			</XStack>
		</YStack>
	)
}
