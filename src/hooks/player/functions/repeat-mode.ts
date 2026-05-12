import { Presets } from 'react-native-pulsar'
import { usePlayerQueueStore } from '../../../stores/player/queue'
import { RepeatMode, TrackPlayer } from 'react-native-nitro-player'

export const toggleRepeatMode = () => {
	const currentMode = usePlayerQueueStore.getState().repeatMode
	Presets.peck()

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
