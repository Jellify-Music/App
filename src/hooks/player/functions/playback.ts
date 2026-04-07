import { triggerHaptic } from '../../use-haptic-feedback'
import usePlayerEngineStore, { PlayerEngine } from '../../../stores/player/engine'
import CastContext from 'react-native-google-cast'
import { usePlayerQueueStore } from '../../../stores/player/queue'
import { TrackPlayer } from 'react-native-nitro-player'

export async function togglePlayback() {
	triggerHaptic('impactMedium')

	const { currentState, totalDuration, currentPosition } = await TrackPlayer.getState()
	const isCasting = usePlayerEngineStore.getState().playerEngineData === PlayerEngine.GOOGLE_CAST

	const castSession = await CastContext.getSessionManager().getCurrentCastSession()

	if (currentState === 'playing') {
		if (isCasting && castSession) return await castSession.client.pause()
		else return await TrackPlayer.pause()
	}

	if (isCasting && castSession) {
		const mediaStatus = await castSession.client.getMediaStatus()
		const streamPosition = mediaStatus?.streamPosition
		if (streamPosition && totalDuration <= streamPosition) {
			await castSession.client.seek({
				position: 0,
				resumeState: 'play',
			})
		}
		await castSession.client.play()
		return
	}

	// if the track has ended, seek to start and play
	if (totalDuration <= currentPosition) await TrackPlayer.seek(0)

	return await TrackPlayer.play()
}

export async function toggleRepeatMode() {
	triggerHaptic('impactLight')
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

	await TrackPlayer.setRepeatMode(nextMode)
	usePlayerQueueStore.getState().setRepeatMode(nextMode)
}
