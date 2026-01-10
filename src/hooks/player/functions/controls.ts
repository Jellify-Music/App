import { isUndefined } from 'lodash'
import { TrackPlayer } from 'react-native-nitro-player'

/**
 * A function that will skip to the previous track if
 * we are still at the beginning of the track.
 *
 * This behavior is configured via {@link SKIP_TO_PREVIOUS_THRESHOLD},
 * which determines how many seconds until we will instead skip to the
 * beginning of the track for convenience.
 *
 * Stops buffering the current track for performance.
 *
 * Starts playback at the end of the operation.
 */
export function previous(): void {
	const currentPosition = TrackPlayer.getState().currentPosition

	if (Math.floor(currentPosition) < 3) {
		TrackPlayer.skipToPrevious()
	} else {
		TrackPlayer.seek(0)
	}

	TrackPlayer.play()
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
export function skip(index: number | undefined): void {
	if (!isUndefined(index)) {
		const currentIndex = TrackPlayer.getState().currentIndex

		if (index === currentIndex) return
		else if (currentIndex < index) {
			while (currentIndex < index) {
				TrackPlayer.skipToNext()
			}
		}
	} else {
		TrackPlayer.skipToNext()
	}

	TrackPlayer.play()
}
