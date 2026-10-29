import { TrackPlayer } from 'react-native-nitro-player'
import { applyHapticFeedback } from '../../utils/haptics'

async function seekTo(position: number) {
	applyHapticFeedback('info')

	return await TrackPlayer.seek(position)
}

export default seekTo
