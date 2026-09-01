import { usePlayerQueueStore } from '../../stores/player/queue'
import { TrackPlayer } from 'react-native-nitro-player'
import { applyHapticFeedback } from '../../utils/haptics'

export async function togglePlayback() {
	applyHapticFeedback('info')

	const { currentState, totalDuration, currentPosition } = await TrackPlayer.getState()

	if (currentState === 'playing') return await TrackPlayer.pause()

	// if the track has ended, seek to start and play
	if (totalDuration <= currentPosition) await TrackPlayer.seek(0)

	return await TrackPlayer.play()
}
