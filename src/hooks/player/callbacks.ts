import { addToQueue, loadNewQueue, removeItemFromQueue } from './functions/queue'
import { previous, skip } from './functions/controls'
import { QueueOrderMutation } from './interfaces'
import { handleDeshuffle, handleShuffle } from './functions/shuffle'
import usePlayerEngineStore, { PlayerEngine } from '../../stores/player/engine'
import { useRemoteMediaClient } from 'react-native-google-cast'
import { triggerHaptic } from '../use-haptic-feedback'
import { usePlayerQueueStore } from '../../stores/player/queue'
import { PlayerQueue, TrackItem, TrackPlayer, TrackPlayerState } from 'react-native-nitro-player'
import { toggleRepeatMode } from './functions/repeat-mode'

/**
 * A mutation to handle toggling the playback state
 */
export const useTogglePlayback = () => {
	const isCasting =
		usePlayerEngineStore((state) => state.playerEngineData) === PlayerEngine.GOOGLE_CAST
	const remoteClient = useRemoteMediaClient()

	return async (state: TrackPlayerState | undefined) => {
		triggerHaptic('impactMedium')
		TrackPlayer.pause()
		if (state === 'playing') {
			if (isCasting && remoteClient) return await remoteClient.pause()
			else return TrackPlayer.pause()
		}

		const { currentPosition, totalDuration } = await TrackPlayer.getState()

		// if the track has ended, seek to start and play
		if (totalDuration <= currentPosition) TrackPlayer.seek(0)

		return TrackPlayer.play()
	}
}

/**
 * @deprecated Let's just use the function this returns directly instead
 * of subscribing to a hook
 */
export const useToggleRepeatMode = () => {
	return toggleRepeatMode
}

/**
 * A mutation to handle seeking to a specific position in the track
 */
export const useSeekTo = () => {
	const isCasting =
		usePlayerEngineStore((state) => state.playerEngineData) === PlayerEngine.GOOGLE_CAST
	const remoteClient = useRemoteMediaClient()

	return async (position: number) => {
		triggerHaptic('impactLight')

		if (isCasting && remoteClient)
			return await remoteClient.seek({
				position: position,
				resumeState: 'play',
			})
		else await TrackPlayer.seek(position)
	}
}

/**
 * A mutation to handle seeking to a specific position in the track
 */
const useSeekBy = () => {
	return async (seekSeconds: number) => {
		triggerHaptic('clockTick')

		const { currentPosition } = await TrackPlayer.getState()

		TrackPlayer.seek(currentPosition + seekSeconds)
	}
}

export const useResetQueue = () => () => {
	usePlayerQueueStore.getState().setUnshuffledQueue([])
	usePlayerQueueStore.getState().setShuffled(false)
	usePlayerQueueStore.getState().setQueueRef('Recently Played')
	usePlayerQueueStore.getState().setQueue([])
	usePlayerQueueStore.getState().setCurrentIndex(undefined)
}
