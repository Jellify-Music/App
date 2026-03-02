import { BaseItemDto, DeviceProfile, ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { SourceType, TrackExtraPayload } from '../../types/JellifyTrack'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import { Api } from '@jellyfin/sdk/lib/api'
import { AudioQuality } from '../../types/AudioQuality'
import uuid from 'react-native-uuid'
import { convertRunTimeTicksToSeconds } from './ticks-to-seconds'
import { DownloadQuality } from '../../stores/settings/usage'
import StreamingQuality from '../../enums/audio-quality'
import { getApi } from '../../stores'
import { TrackItem } from 'react-native-nitro-player'
import { formatArtistItemsNames } from '../formatting/artist-names'
import { getBlurhashFromDto } from '../parsing/blurhash'
import { slimifyDto } from './slimify-dto'

/**
 * Ensures a valid session ID is returned.
 * The ?? operator doesn't catch empty strings, so we need this helper.
 * Empty session IDs cause MusicService to crash with "Session ID must be unique. ID="
 */
function getValidSessionId(sessionId: string | null | undefined): string {
	if (sessionId && sessionId.trim() !== '') {
		return sessionId
	}
	return uuid.v4().toString()
}

/**
 * Gets the artwork URL for a track, prioritizing the track's own artwork over the album's artwork.
 * Falls back to artist image if no album artwork is available.
 *
 * @param api The API instance
 * @param item The track item
 * @returns The artwork URL or undefined
 */
function getTrackArtworkUrl(api: Api, item: BaseItemDto): string | undefined {
	const { AlbumId, AlbumPrimaryImageTag, ImageTags, Id, AlbumArtists, ArtistItems } = item

	// Check if the track has its own Primary image
	if (ImageTags?.Primary && Id) {
		return getImageApi(api).getItemImageUrlById(Id, ImageType.Primary)
	}

	// Fall back to album artwork (only if the album has an image)
	if (AlbumId && AlbumPrimaryImageTag) {
		return getImageApi(api).getItemImageUrlById(AlbumId, ImageType.Primary)
	}

	// Fall back to first album/artist image (ArtistItems works with SlimifiedBaseItemDto)
	const artistId = AlbumArtists?.[0]?.Id ?? ArtistItems?.[0]?.Id
	if (artistId) {
		return getImageApi(api).getItemImageUrlById(artistId, ImageType.Primary)
	}

	return undefined
}

/**
 * Gets quality-specific parameters for transcoding
 *
 * @param quality The desired quality for transcoding
 * @returns Object with bitrate and other quality parameters
 */
export function getQualityParams(
	quality: DownloadQuality | StreamingQuality,
): AudioQuality | undefined {
	switch (quality) {
		case 'original':
			return undefined
		case 'high':
			return {
				AudioBitRate: '320000',
				MaxAudioBitDepth: '24',
			}
		case 'medium':
			return {
				AudioBitRate: '192000',
				MaxAudioBitDepth: '16',
			}
		case 'low':
			return {
				AudioBitRate: '128000',
				MaxAudioBitDepth: '16',
			}
		default:
			return {
				AudioBitRate: '192000',
				MaxAudioBitDepth: '16',
			}
	}
}

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
export async function mapDtoToTrack(
	item: BaseItemDto,
	deviceProfile: DeviceProfile,
	source: SourceType = 'stream',
): Promise<TrackItem> {
	const api = getApi()!

	// Only include headers when we have an API token (streaming cases). For downloaded tracks it's not needed.
	const headers = (api as Api | undefined)?.accessToken
		? { AUTHORIZATION: (api as Api).accessToken }
		: undefined

	return {
		...(headers ? { headers } : {}),
		id: item.Id,
		title: item.Name,
		artist: formatArtistItemsNames(item.ArtistItems),
		album: item.Album,
		duration: convertRunTimeTicksToSeconds(item.RunTimeTicks ?? 0),
		url: '',
		artwork: getTrackArtworkUrl(api, item),
		extraPayload: {
			item: JSON.stringify(slimifyDto(item)),
			mediaSourceInfo: '{}', // This will be populated later in the playback flow when we have the MediaSourceInfo available
			sessionId: '',
			blurhash: getBlurhashFromDto(item),
		} as TrackExtraPayload,
	} as TrackItem
}
