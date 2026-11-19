import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import i18n from '../../i18n'

/**
 * Formats a track name by using the track's Name property,
 * falling back to OriginalTitle if Name is not available,
 * and finally defaulting to "Untitled Track" if neither is present.
 *
 * @param track the track whose name should be formatted
 * @returns the formatted track name
 */
export default function formatTrackName(track: BaseItemDto): string {
	return track.Name ?? track.OriginalTitle ?? i18n.t('placeholders.untitledTrack')
}
