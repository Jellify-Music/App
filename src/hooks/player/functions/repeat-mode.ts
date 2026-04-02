import { usePlayerQueueStore } from '../../../stores/player/queue'
import { triggerHaptic } from '../../use-haptic-feedback'
import { RepeatMode, TrackPlayer } from 'react-native-nitro-player'

export const toggleRepeatMode = () => {
	const currentMode = usePlayerQueueStore.getState().repeatMode
	triggerHaptic('impactLight')

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
