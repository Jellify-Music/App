import { Cast } from 'react-native-nitro-player'
import { updateCastTrackMediaInfo } from './utils/track-media-info'

export default function registerCast() {
	Cast.onTracksNeedCastUrls(async (tracks) => {
		if (tracks.length === 0) return

		await updateCastTrackMediaInfo(tracks)
	})
}
