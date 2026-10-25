import { H5, SizableText, XStack, YStack } from 'tamagui'
import { SettingsStackParamList } from './types'
import Button from '../../components/Global/helpers/button'
import Icon from '../../components/Global/components/icon'
import { useJellifyServer } from '../../stores/auth'
import { CommonActions, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { DownloadManager, TrackPlayer } from 'react-native-nitro-player'
import navigationRef from '../navigation'
import resetQueue from '../../player/queuing/reset'

export default function SignOutModal(): React.JSX.Element {
	const [server] = useJellifyServer()

	const settingsStackNavigation =
		useNavigation<NativeStackNavigationProp<SettingsStackParamList>>()

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
		<YStack margin='6'>
			<H5>{`Sign out of ${server?.name ?? 'Jellyfin'}?`}</H5>
			<XStack gap='2'>
				<Button
					testID='sign-out-cancel-button'
					icon={() => <Icon name='chevron-left' size='7' color={'borderColor'} />}
					borderWidth={'1'}
					borderColor={'borderColor'}
					flex={1}
					onPress={settingsStackNavigation.goBack}
				>
					<SizableText fontWeight='6' color={'borderColor'}>
						Cancel
					</SizableText>
				</Button>
				<Button
					testID='sign-out-button'
					flex={1}
					icon={() => <Icon name='logout' size='7' color={'danger'} />}
					borderColor={'danger'}
					onPress={onSignOut}
				>
					<SizableText fontWeight='6' color={'danger'}>
						Sign out
					</SizableText>
				</Button>
			</XStack>
		</YStack>
	)
}
