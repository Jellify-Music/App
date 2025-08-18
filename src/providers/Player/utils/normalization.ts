import { isNull, isUndefined } from 'lodash'
import JellifyTrack from '../../../types/JellifyTrack'

/**
 * Tracks in Jellyfin are normalized to a target volume level of -18 LUFS.
 *
 * The `NormalizationGain` property on the {@link BaseItemDto} is the difference in LUFS from the target volume level of -18 LUFS.
 */
const JELLYFIN_LUFS = -18

/**
 * The maximum boost in decibels that can be applied to a track.
 */
const MAX_BOOST_DB = 6

/**
 * The minimum reduction in decibels that can be applied to a track.
 */
const MIN_REDUCTION_DB = -10

/**
 * Calculates the normalization gain for a track.
 *
 * @param track - The track to calculate the normalization gain for.
 * @returns The normalization gain for the track.
 */
export default function calculateTrackVolume(track: JellifyTrack): number {
	const { NormalizationGain } = track.item

	console.debug('Normalization gain for track', NormalizationGain)

	/**
	 * If the track has no normalization gain, return 1 to play the track
	 * at the full module volume.
	 */
	if (isUndefined(NormalizationGain) || isNull(NormalizationGain)) {
		return 1
	}

	/**
	 * Clamp the normalization gain to the maximum boost and minimum reduction.
	 */
	const clampedDb = Math.min(MAX_BOOST_DB, Math.max(MIN_REDUCTION_DB, NormalizationGain))

	/**
	 * The linear gain for the track.
	 *
	 * This is the gain that will be applied to the track to bring it to the target volume level.
	 *
	 * @see https://sound.stackexchange.com/questions/38722/convert-db-value-to-linear-scale
	 */
	const linearGain = Math.pow(10, clampedDb / 20)

	return Math.min(1, Math.max(0, linearGain))
}
