import { SKIP_TO_PREVIOUS_THRESHOLD } from '../../../configs/player.config'
import { isUndefined } from 'lodash'
import { TrackPlayer } from 'react-native-nitro-player'
import { triggerHaptic } from '../../use-haptic-feedback'

let isSkipInFlight = false

/**
 * A function that will skip to the previous track if
 * we are still at the beginning of the track, or skip
 * to the beginning of the track if we are past a certain threshold.
 *
 * This behavior is configured via {@link SKIP_TO_PREVIOUS_THRESHOLD},
 * which determines how many seconds until we will instead skip to the
 * beginning of the track for convenience.
 *
 * Starts playback at the end of the operation if the player was already playing.
 * Does not resume playback if the player was paused
 */
export async function previous(): Promise<void> {
	triggerHaptic('impactMedium')

	const { currentState, currentIndex, currentPosition } = await TrackPlayer.getState()

	if (isUndefined(currentIndex)) return

	if (Math.floor(currentPosition) <= SKIP_TO_PREVIOUS_THRESHOLD) {
		await TrackPlayer.skipToPrevious()
	} else {
		await TrackPlayer.seek(0)
	}

	if (currentState === 'playing') await TrackPlayer.play()
}

/**
 * A function that will skip to the next track or the specified
 * track index.
 *
 * Always starts playback at the end of the operation.
 *
 * @param index The track index to skip to, to skip multiple tracks
 */
export async function skip(index: number | undefined): Promise<void> {
	if (isSkipInFlight) return
	isSkipInFlight = true

	try {
		triggerHaptic('impactMedium')

		const { currentIndex } = await TrackPlayer.getState()

		if (!isUndefined(index)) {
			if (index === currentIndex) return
			await TrackPlayer.skipToIndex(index)
		} else {
			await TrackPlayer.skipToNext()
		}

		await TrackPlayer.play()
	} finally {
		isSkipInFlight = false
	}
}
