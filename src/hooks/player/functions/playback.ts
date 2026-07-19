// Google Cast (react-native-google-cast) removed — casting is handled natively by
// nitro-player, so TrackPlayer.* calls automatically route to the connected device.
// import usePlayerEngineStore from '../../../stores/player/engine'
// import CastContext from 'react-native-google-cast'
import { usePlayerQueueStore } from '../../../stores/player/queue'
import { TrackPlayer } from 'react-native-nitro-player'
// import { PlayerEngine } from '../../../enums/player-engine'
import { applyHapticFeedback } from '../../../utils/haptics'

export async function togglePlayback() {
	applyHapticFeedback('info')

	const { currentState, totalDuration, currentPosition } = await TrackPlayer.getState()

	// --- Google Cast remote-client branch (commented out) ---
	// const isCasting = usePlayerEngineStore.getState().playerEngine === PlayerEngine.GOOGLE_CAST
	// const castSession = await CastContext.getSessionManager().getCurrentCastSession()
	// if (currentState === 'playing') {
	// 	if (isCasting && castSession) return await castSession.client.pause()
	// 	else return await TrackPlayer.pause()
	// }
	// if (isCasting && castSession) {
	// 	const mediaStatus = await castSession.client.getMediaStatus()
	// 	const streamPosition = mediaStatus?.streamPosition
	// 	if (streamPosition && totalDuration <= streamPosition) {
	// 		await castSession.client.seek({ position: 0, resumeState: 'play' })
	// 	}
	// 	await castSession.client.play()
	// 	return
	// }

	if (currentState === 'playing') return await TrackPlayer.pause()

	// if the track has ended, seek to start and play
	if (totalDuration <= currentPosition) await TrackPlayer.seek(0)

	return await TrackPlayer.play()
}

export async function toggleRepeatMode() {
	applyHapticFeedback('info')

	const currentMode = await TrackPlayer.getRepeatMode()
	let nextMode: 'Playlist' | 'track' | 'off'

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

	usePlayerQueueStore.setState((state) => ({
		...state,
		repeatMode: nextMode,
	}))

	await TrackPlayer.setRepeatMode(nextMode)
}
