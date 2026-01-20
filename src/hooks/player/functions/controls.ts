import { isUndefined } from 'lodash'
import { SKIP_TO_PREVIOUS_THRESHOLD } from '../../../configs/player.config'
import TrackPlayer, { State } from 'react-native-track-player'

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
export async function previous(): Promise<void> {
	const { position } = await TrackPlayer.getProgress()

	if (Math.floor(position) < SKIP_TO_PREVIOUS_THRESHOLD) {
		await TrackPlayer.stop() // Stop buffering the current track
		await TrackPlayer.skipToPrevious()
	} else await TrackPlayer.seekTo(0)

	const { state } = await TrackPlayer.getPlaybackState()

	if (state !== State.Playing) await TrackPlayer.play()
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
	await TrackPlayer.stop() // Stop buffering the current track

	if (!isUndefined(index)) await TrackPlayer.skip(index)
	else await TrackPlayer.skipToNext()

	const { state } = await TrackPlayer.getPlaybackState()
	if (state !== State.Playing) await TrackPlayer.play()
}
