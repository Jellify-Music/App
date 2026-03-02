import { SKIP_TO_PREVIOUS_THRESHOLD } from '../../../configs/player.config'
import { isUndefined } from 'lodash'
import { TrackPlayer } from 'react-native-nitro-player'

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
	const { currentPosition, currentState } = await TrackPlayer.getState()

	if (Math.floor(currentPosition) < SKIP_TO_PREVIOUS_THRESHOLD) {
		TrackPlayer.skipToPrevious()
	} else {
		TrackPlayer.seek(0)
	}

	if (currentState === 'playing') await TrackPlayer.play()
}

/**
 * A function that will skip to the next track or the specified
 * track index.
 *
 * Stops buffering the current track for performance.
 *
 * Starts playback at the end of the operation.
 *
 * @param index The track index to skip to, to skip multiple tracks
 */
export async function skip(index: number | undefined): Promise<void> {
	if (!isUndefined(index)) {
		const { currentIndex } = await TrackPlayer.getState()

		if (index === currentIndex) return
		else {
			TrackPlayer.skipToIndex(index)
		}
	} else {
		TrackPlayer.skipToNext()
	}

	TrackPlayer.play()
}
