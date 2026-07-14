import { PlayerConfig, TrackPlayer } from 'react-native-nitro-player'
import { PermissionsAndroid, Platform } from 'react-native'
import { captureError, LoggingContext } from '../../utils/logging'
import { usePlayerSettingsStore } from '../../stores/settings/player'
import {
	syncDeviceProfiles,
	registerPlayerEventHandlers,
	restoreFromStorage,
} from './utils/initialization'

export async function configureNitroPlayer(config: Partial<PlayerConfig>) {
	try {
		await TrackPlayer.configure(config)
	} catch (error) {
		captureError(error, LoggingContext.NitroPlayer, 'Failed to reconfigure TrackPlayer')
	}
}

export default function registerNitroPlayer() {
	const { lookahead: lookaheadCount } = usePlayerSettingsStore.getState()

	configureNitroPlayer({
		lookaheadCount,
		androidAutoEnabled: Platform.OS === 'android',
		carPlayEnabled: false,
		showInNotification: true,
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

/**
 * Initializes the player by registering event handlers and restoring state from storage.
 * This function should be called once during app startup.
 */
function Initialize() {
	syncDeviceProfiles()

	registerPlayerEventHandlers()
}
