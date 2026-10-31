import { H5, XStack, YStack } from 'tamagui'
import { SettingsStackParamList } from './types'
import Button from '../../components/Global/helpers/button'
import Icon from '../../components/Global/components/icon'
import { usePublicServerInfo } from '../../api/queries/public-server-info'
import { CommonActions, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { DownloadManager, TrackPlayer } from 'react-native-nitro-player'
import navigationRef from '../navigation'
import resetQueue from '../../player/queuing/reset'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function SignOutModal(): React.JSX.Element {
	const { data: server } = usePublicServerInfo()

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
		<SafeAreaView>
			<YStack margin='4' gap='4'>
				<H5>{`Sign out of ${server?.ServerName ?? 'Jellyfin'}?`}</H5>
				<XStack gap='2'>
					<Button
						testID='sign-out-cancel-button'
						icon={() => <Icon name='chevron-left' size='7' color={'borderColor'} />}
						borderWidth={'1'}
						borderColor={'borderColor'}
						color={'borderColor'}
						flex={1}
						onPress={settingsStackNavigation.goBack}
					>
						Cancel
					</Button>
					<Button
						testID='sign-out-button'
						flex={1}
						icon={<Icon name='logout' size='7' color={'danger'} />}
						borderColor={'danger'}
						color={'danger'}
						onPress={onSignOut}
					>
						Sign out
					</Button>
				</XStack>
			</YStack>
		</SafeAreaView>
	)
}
