import { isNull, isUndefined } from 'lodash'
import { TrackItem, TrackPlayer } from 'react-native-nitro-player'
import getTrackDto from '../../utils/mapping/track-extra-payload'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'

/**
 * The maximum volume that can be set on the {@link TrackPlayer}.
 */
const MAX_VOLUME = 100

/**
 * The linear normalization value for full volume.
 */
const MAX_NORMALIZED_VOLUME = 1

/**
 * The maximum boost in decibels that can be applied to a track.
 */
const MAX_BOOST_DB = 6

/**
 * The minimum reduction in decibels that can be applied to a track.
 */
const MIN_REDUCTION_DB = -10

export default async function applyAudioNormalization(track: TrackItem): Promise<void> {
	const volume = calculateTrackVolume(track)

	await TrackPlayer.setVolume(volume)
}

export function resetPlayerVolume(): Promise<void> {
	return TrackPlayer.setVolume(MAX_VOLUME)
}

/**
 * Calculates the normalization gain for a track.
 *
 * @param track - The track to calculate the normalization gain for.
 * @returns The normalization gain for the track.
 *
 * Audio Normalization in Jellify would not be possible without the help
 * of Chaphasilor - present maintainer and designer of Finamp.
 *
 * @see https://github.com/Chaphasilor
 */
export function calculateTrackVolume(track: TrackItem): number {
	const { NormalizationGain } = getTrackDto(track) as BaseItemDto

	/**
	 * If the track has no normalization gain, return the default volume
	 * to play the track at the full module volume.
	 */
	if (isUndefined(NormalizationGain) || isNull(NormalizationGain)) {
		return MAX_VOLUME
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

	const normalizedGain = Math.min(MAX_NORMALIZED_VOLUME, Math.max(0, linearGain))

	return normalizedGain * MAX_VOLUME
}
