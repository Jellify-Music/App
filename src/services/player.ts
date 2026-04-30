import { TrackPlayer } from 'react-native-nitro-player'
import { TRACKPLAYER_LOOKAHEAD_COUNT } from '../configs/player.config'
import { PermissionsAndroid, Platform } from 'react-native'

export default async function registerTrackPlayer() {
	await TrackPlayer.configure({
		androidAutoEnabled: Platform.OS === 'android',
		carPlayEnabled: false,
		showInNotification: true,
		lookaheadCount: TRACKPLAYER_LOOKAHEAD_COUNT,
	})

	if (Platform.OS === 'android' && Platform.Version >= 33) {
		PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)
	}
}
