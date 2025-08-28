/**
 * Determines whether playback for a track was finished
 *
 * @param lastPosition The last known position in the track the user was at
 * @param duration The duration of the track
 * @returns Whether the user has made it through 80% of the track
 */
export default function isPlaybackFinished(lastPosition: number, duration: number): boolean {
	return lastPosition / duration > 0.8
}
