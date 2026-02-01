import { TrackPlayer } from 'react-native-nitro-player'

export default function registerTrackPlayer() {
	TrackPlayer.configure({
		androidAutoEnabled: false,
		carPlayEnabled: false,
		showInNotification: true,
	})
}
