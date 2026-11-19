import { H5, XStack, YStack } from 'tamagui'
import { SettingsStackNavigator } from './types'
import Button from '../../components/Global/utils/button'
import Icon from '../../components/Global/components/icon'
import { usePublicServerInfo } from '../../api/queries/public-server-info'
import { CommonActions, useNavigation } from '@react-navigation/native'
import { DownloadManager, TrackPlayer } from 'react-native-nitro-player'
import navigationRef from '../navigation'
import resetQueue from '../../player/queuing/reset'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSignOut } from '../../stores/auth'
import { useTranslation } from 'react-i18next'

export default function SignOutModal(): React.JSX.Element {
	const { t } = useTranslation()

	const { data: server } = usePublicServerInfo()

	const settingsStackNavigation = useNavigation<SettingsStackNavigator>()

	const signOut = useSignOut()

	const clearDownloads = async () => {
		await DownloadManager.deleteAllDownloads()
	}

	const onSignOut = async () => {
		await TrackPlayer.pause()

		settingsStackNavigation.goBack()

		navigationRef.dispatch(
			CommonActions.navigate('Login', {
				screen: 'ServerAddress',
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
		signOut()
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
						{t('common.cancel')}
					</Button>
					<Button
						testID='sign-out-button'
						flex={1}
						icon={<Icon name='logout' size='7' color={'danger'} />}
						borderColor={'danger'}
						color={'danger'}
						onPress={onSignOut}
					>
						{t('settings.signOut')}
					</Button>
				</XStack>
			</YStack>
		</SafeAreaView>
	)
}
