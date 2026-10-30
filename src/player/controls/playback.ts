import { TrackPlayer } from 'react-native-nitro-player'
import { applyHapticFeedback } from '../../utils/haptics'
import { updateTrackMediaInfo } from '../../services/player/utils/track-media-info'

export async function togglePlayback() {
	applyHapticFeedback('info')

	const { currentState, totalDuration, currentPosition, currentTrack } =
		await TrackPlayer.getState()

	if (currentState === 'playing') return await TrackPlayer.pause()

	// if the track has ended, seek to start and play
	if (totalDuration <= currentPosition) await TrackPlayer.seek(0)

	await TrackPlayer.play()

	// A track whose URL failed to resolve won't be retried by the player on its own
	if (currentTrack && !currentTrack.url) await updateTrackMediaInfo([currentTrack])
}
