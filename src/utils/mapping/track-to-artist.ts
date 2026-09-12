import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import { uniqBy } from 'lodash'
import { captureWarning, LoggingContext } from '../../utils/logging'

/**
 *
 * @param tracks
 * @param signal
 * @returns
 */
export function mapTracksToArtists(tracks: BaseItemDto[]): BaseItemDto[] {
	const artists: BaseItemDto[] = uniqBy(
		tracks
			.flatMap((track) => track.ArtistItems)
			.filter((artist) => !!artist && artist.Id)
			.map((artist) => ({
				...artist,
				Type: BaseItemKind.MusicArtist,
			})),
		'Id',
	)

	if (tracks.length > 0 && artists.length === 0) {
		captureWarning(
			LoggingContext.Recents,
			`mapTracksToArtists got ${tracks.length} tracks but derived 0 artistIds from ArtistItems`,
		)

		return []
	}

	return artists
}
