import { PlayerConfig, TrackPlayer } from 'react-native-nitro-player'
import { PermissionsAndroid, Platform } from 'react-native'
import { captureError, LoggingContext } from '../utils/logging'
import Initialize from './utils/initialization'
import { usePlayerSettingsStore } from '../stores/settings/player'

const basePlayerConfig: Partial<PlayerConfig> = {
	androidAutoEnabled: Platform.OS === 'android',
	carPlayEnabled: false,
	showInNotification: true,
}

export async function configureNitroPlayer(config: Partial<PlayerConfig>) {
	try {
		await TrackPlayer.configure({ ...basePlayerConfig, ...config })
	} catch (error) {
		captureError(error, LoggingContext.NitroPlayer, 'Failed to reconfigure TrackPlayer')
	}
}

export default function registerNitroPlayer() {
	const lookaheadCount = usePlayerSettingsStore.getState().lookahead

	configureNitroPlayer({
		lookaheadCount,
	})
		.then(() => {
			Initialize()

			if (Platform.OS === 'android' && Platform.Version >= 33) {
				PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)
			}
		})
		.catch((error) => {
			captureError(error, LoggingContext.NitroPlayer, 'Failed to configure TrackPlayer')
		})
}
