import { useIsCasting } from '../../stores/player/engine'
import CastContext from 'react-native-google-cast'
import { triggerHaptic } from '../use-haptic-feedback'
import { usePlayerQueueStore } from '../../stores/player/queue'
import { TrackPlayer } from 'react-native-nitro-player'
import { toggleRepeatMode } from './functions/repeat-mode'
import { togglePlayback } from './functions/playback'
import { applyHapticFeedback } from '../../utils/haptics'

/**
 * A mutation to handle toggling the playback state
 *
 * @deprecated Use the function this invokes directly
 */
export const useTogglePlayback = () => {
	return togglePlayback
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
	const isCasting = useIsCasting()

	return async (position: number) => {
		applyHapticFeedback('info')

		if (isCasting) {
			const session = await CastContext.sessionManager.getCurrentCastSession()

			return session?.client?.seek({
				position: position,
				resumeState: 'play',
			})
		} else return await TrackPlayer.seek(position)
	}
}

/**
 * A mutation to handle seeking to a specific position in the track
 */
const useSeekBy = () => {
	return async (seekSeconds: number) => {
		triggerHaptic('impactLight')

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
