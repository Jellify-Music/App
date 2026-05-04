import { TrackPlayer } from 'react-native-nitro-player'
import { TRACKPLAYER_LOOKAHEAD_COUNT } from '../configs/player.config'
import { PermissionsAndroid, Platform } from 'react-native'
import { captureError, LoggingContext } from '../utils/logging'

export default function registerNitroPlayer() {
	TrackPlayer.configure({
		androidAutoEnabled: Platform.OS === 'android',
		carPlayEnabled: false,
		showInNotification: true,
		lookaheadCount: TRACKPLAYER_LOOKAHEAD_COUNT,
	})
		.then(() => {
			if (Platform.OS === 'android' && Platform.Version >= 33) {
				PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)
			}
		})
		.catch((error) => {
			captureError(error, LoggingContext.NitroPlayer, 'Failed to configure TrackPlayer')
		})
}
