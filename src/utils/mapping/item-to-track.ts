import { BaseItemDto, ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { TrackExtraPayload } from '../../types/JellifyTrack'
import { Api } from '@jellyfin/sdk/lib/api'
import { convertRunTimeTicksToSeconds } from './ticks-to-seconds'
import { getApi } from '../../stores'
import { DownloadManager, TrackItem } from 'react-native-nitro-player'
import { formatArtistItemsNames } from '../formatting/artist-names'
import { getBlurhashFromDto } from '../parsing/blurhash'
import { slimifyDto } from './slimify-dto'
import { getTrackMediaSourceInfo } from './track-extra-payload'
import { getItemImageUrl } from '../../api/queries/image/utils'

/**
 * A mapper function that can be used to get a RNTP {@link Track} compliant object
 * from a Jellyfin server {@link BaseItemDto}. Applies a queuing type to the track
 * object so that it can be referenced later on for determining where to place
 * the track in the queue
 *
 * @param item The {@link BaseItemDto} of the track
 * @param queuingType The type of queuing we are performing
 * @param downloadQuality The quality to use for downloads (used only when saving files)
 * @param streamingQuality The quality to use for streaming (used for playback URLs)
 * @returns A {@link JellifyTrack}, which represents a Jellyfin library track queued in the {@link TrackPlayer}
 */
export async function mapDtoToTrack(item: BaseItemDto): Promise<TrackItem> {
	const api = getApi()!

	const downloadedTracks = await DownloadManager.getDownloadedTrack(item.Id!)

	// Only include headers when we have an API token (streaming cases). For downloaded tracks it's not needed.
	const headers = (api as Api | undefined)?.accessToken
		? { AUTHORIZATION: (api as Api).accessToken }
		: undefined

	/**
	 * The mediaSourceInfo is used to store the MediaSourceInfo object from the Jellyfin server.
	 *
	 * In the cases of downloaded tracks, this should be populated ahead of time
	 *
	 * In the cases of streaming tracks, this will be populated later in the `onTracksNeedUpdate`
	 * callback when the MediaSourceInfo is needed from the server.
	 */
	const mediaSourceInfo = getTrackMediaSourceInfo(downloadedTracks?.originalTrack) ?? '{}'

	return {
		...(headers ? { headers } : {}),
		id: item.Id,
		title: item.Name,
		artist: formatArtistItemsNames(item.ArtistItems),
		album: item.Album,
		duration: convertRunTimeTicksToSeconds(item.RunTimeTicks ?? 0),
		url: '',
		artwork: getItemImageUrl(item, ImageType.Primary),
		extraPayload: {
			item: JSON.stringify(slimifyDto(item)),
			mediaSourceInfo: JSON.stringify(mediaSourceInfo), // This will be populated later in the playback flow when we have the MediaSourceInfo available
			sessionId: '',
			blurhash: getBlurhashFromDto(item),
		} as TrackExtraPayload,
	} as TrackItem
}
