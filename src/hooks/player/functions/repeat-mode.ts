import { usePlayerQueueStore } from '../../../stores/player/queue'
import { RepeatMode, TrackPlayer } from 'react-native-nitro-player'
import { applyHapticFeedback } from '../../../utils/haptics'

export const toggleRepeatMode = () => {
	const currentMode = usePlayerQueueStore.getState().repeatMode
	applyHapticFeedback('info')

	let nextMode: RepeatMode

	switch (currentMode) {
		case 'off':
			nextMode = 'Playlist'
			break
		case 'Playlist':
			nextMode = 'track'
			break
		default:
			nextMode = 'off'
	}

	TrackPlayer.setRepeatMode(nextMode)
	usePlayerQueueStore.getState().setRepeatMode(nextMode)
}
