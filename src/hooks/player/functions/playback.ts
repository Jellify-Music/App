import TrackPlayer, { RepeatMode, State } from 'react-native-track-player'
import { triggerHaptic } from '../../use-haptic-feedback'
import usePlayerEngineStore, { PlayerEngine } from '../../../stores/player/engine'
import CastContext from 'react-native-google-cast'
import { usePlayerQueueStore } from '../../../stores/player/queue'

export async function togglePlayback() {
	triggerHaptic('impactMedium')

	const { state } = await TrackPlayer.getPlaybackState()
	const isCasting = usePlayerEngineStore.getState().playerEngineData === PlayerEngine.GOOGLE_CAST

	const castSession = await CastContext.getSessionManager().getCurrentCastSession()

	if (state === State.Playing) {
		if (isCasting && castSession) return await castSession.client.pause()
		else return await TrackPlayer.pause()
	}

	const { duration, position } = await TrackPlayer.getProgress()
	if (isCasting && castSession) {
		const mediaStatus = await castSession.client.getMediaStatus()
		const streamPosition = mediaStatus?.streamPosition
		if (streamPosition && duration <= streamPosition) {
			await castSession.client.seek({
				position: 0,
				resumeState: 'play',
			})
		}
		await castSession.client.play()
		return
	}

	// if the track has ended, seek to start and play
	if (duration <= position) await TrackPlayer.seekTo(0)

	return await TrackPlayer.play()
}

export async function toggleRepeatMode() {
	triggerHaptic('impactLight')
	const currentMode = await TrackPlayer.getRepeatMode()
	let nextMode: RepeatMode

	switch (currentMode) {
		case RepeatMode.Off:
			nextMode = RepeatMode.Queue
			break
		case RepeatMode.Queue:
			nextMode = RepeatMode.Track
			break
		default:
			nextMode = RepeatMode.Off
	}

	await TrackPlayer.setRepeatMode(nextMode)
	usePlayerQueueStore.getState().setRepeatMode(nextMode)
}
