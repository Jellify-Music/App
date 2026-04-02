import { TrackPlayer } from 'react-native-nitro-player'
import { TRACKPLAYER_LOOKAHEAD_COUNT } from '../configs/player.config'

export default function registerTrackPlayer() {
	TrackPlayer.configure({
		androidAutoEnabled: false,
		carPlayEnabled: false,
		showInNotification: true,
		lookaheadCount: TRACKPLAYER_LOOKAHEAD_COUNT,
	})
}
