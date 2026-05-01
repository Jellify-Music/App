import { BaseItemDto, BaseItemKind, ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { TrackExtraPayload } from '../../types/JellifyTrack'
import { Api } from '@jellyfin/sdk/lib/api'
import { convertRunTimeTicksToSeconds } from './ticks-to-seconds'
import { getApi } from '../../stores'
import { DownloadedTrack, TrackItem } from 'react-native-nitro-player'
import { formatArtistItemsNames } from '../formatting/artist-names'
import { getBlurhashFromDto } from '../parsing/blurhash'
import { slimifyDto } from './slimify-dto'
import { getItemImageUrl } from '../../api/queries/image/utils'
import { getTrackMediaSourceInfo } from './track-extra-payload'
import { getItemName } from '../formatting/item-names'

export function mapDtosToTracks(
	items: BaseItemDto[],
	downloadedTracks: DownloadedTrack[],
): TrackItem[] {
	const downloadedTrackIds = new Map(downloadedTracks.map((t) => [t.trackId, t]))

	return items.map((item) => mapDtoToTrack(item, downloadedTrackIds))
}

/**
 * A mapper function that can be used to get a Nitro Player {@link TrackItem} compliant object
 * from a Jellyfin server {@link BaseItemDto}. Applies a queuing type to the track
 * object so that it can be referenced later on for determining where to place
 * the track in the queue
 *
 * @param item The {@link BaseItemDto} of the track
 * @param downloadedTrackIds A map of downloaded track IDs to their corresponding {@link DownloadedTrack} objects, used to populate the track's URL and artwork if it's downloaded
 * @returns A {@link TrackItem}, which represents a Jellyfin library track queued in the {@link TrackPlayer}
 */
export function mapDtoToTrack(
	item: BaseItemDto,
	downloadedTrackIds: Map<string, DownloadedTrack>,
): TrackItem {
	const api = getApi()!

	const downloadedTrack = downloadedTrackIds.get(item.Id!)

	// Pluck the MediaSourceInfo from the downloaded track's extra payload if it's available, otherwise use an empty object
	const mediaSourceInfo = downloadedTrack
		? getTrackMediaSourceInfo(downloadedTrack.originalTrack)
		: ({} as const)

	// Only include headers when we have an API token (streaming cases). For downloaded tracks it's not needed.
	const headers = (api as Api | undefined)?.accessToken
		? { AUTHORIZATION: (api as Api).accessToken }
		: undefined

	if (downloadedTrack?.localPath) {
		console.debug('Downloaded track path', `file://${downloadedTrack.localPath}`)
	}

	if (downloadedTrack?.localArtworkPath) {
		console.debug('Downloaded track artwork path', `file://${downloadedTrack.localArtworkPath}`)
	}

	return {
		...(headers ? { headers } : {}),
		id: item.Id ?? '',
		url: downloadedTrack?.localPath ? `file://${downloadedTrack.localPath}` : '',
		artwork: downloadedTrack?.localArtworkPath
			? `file://${downloadedTrack.localArtworkPath}`
			: getItemImageUrl(item, ImageType.Primary, {
					maxHeight: 500,
					maxWidth: 500,
				}),
		title: getItemName(item),
		artist: formatArtistItemsNames(item.ArtistItems),
		album: getItemName({
			Id: item.AlbumId,
			Type: BaseItemKind.MusicAlbum,
			Name: item.Album,
			OriginalTitle: item.Album,
		} as BaseItemDto),
		duration: convertRunTimeTicksToSeconds(item.RunTimeTicks ?? 0),

		// All extraPayload properties to conform to Nitro Modules AnyMap
		extraPayload: {
			item: JSON.stringify(slimifyDto(item)),
			mediaSourceInfo: JSON.stringify(mediaSourceInfo), // This will be populated later in the playback flow when we have the MediaSourceInfo available
			sessionId: '',
			blurhash: getBlurhashFromDto(item),
		} as TrackExtraPayload,
	} as TrackItem
}
