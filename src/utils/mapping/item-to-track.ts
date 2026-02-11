import {
	BaseItemDto,
	DeviceProfile,
	ImageType,
	MediaSourceInfo,
	PlaybackInfoResponse,
} from '@jellyfin/sdk/lib/generated-client/models'
import JellifyTrack, { getTrackExtraPayload, TrackExtraPayload } from '../../types/JellifyTrack'
import { QueuingType } from '../../enums/queuing-type'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import { AudioApi } from '@jellyfin/sdk/lib/generated-client/api'
import { JellifyDownload } from '../../types/JellifyDownload'
import { Api } from '@jellyfin/sdk/lib/api'
import { AudioQuality } from '../../types/AudioQuality'
import { queryClient } from '../../constants/query-client'
import { isUndefined } from 'lodash'
import uuid from 'react-native-uuid'
import { convertRunTimeTicksToSeconds } from './ticks-to-seconds'
import { DownloadQuality } from '../../stores/settings/usage'
import MediaInfoQueryKey from '../../api/queries/media/keys'
import StreamingQuality from '../../enums/audio-quality'
import { getAudioCache } from '../../api/mutations/download/offlineModeUtils'
import RNFS from 'react-native-fs'
import { getApi } from '../../stores'
import { TrackItem } from 'react-native-nitro-player'
import { formatArtistNames } from '../formatting/artist-names'
import { getBlurhashFromDto } from '../parsing/blurhash'
import { MediaInfoQuery } from '../../api/queries/media/queries'
import { TrackMediaInfo } from '../../types/TrackMediaInfo'

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
	const { AlbumId, AlbumPrimaryImageTag, ImageTags, Id, AlbumArtists } = item

	// Check if the track has its own Primary image
	if (ImageTags?.Primary && Id) {
		return getImageApi(api).getItemImageUrlById(Id, ImageType.Primary)
	}

	// Fall back to album artwork (only if the album has an image)
	if (AlbumId && AlbumPrimaryImageTag) {
		return getImageApi(api).getItemImageUrlById(AlbumId, ImageType.Primary)
	}

	// Fall back to first album artist's image
	if (AlbumArtists && AlbumArtists.length > 0 && AlbumArtists[0].Id) {
		return getImageApi(api).getItemImageUrlById(AlbumArtists[0].Id, ImageType.Primary)
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
): Promise<TrackItem> {
	const api = getApi()!

	const downloadedTracks = getAudioCache()
	const downloads = downloadedTracks.filter((download) => download.id === item.Id)

	const mediaInfo = await queryClient.ensureQueryData<PlaybackInfoResponse>(
		MediaInfoQuery(item.Id, 'stream'),
	)

	let trackMediaInfo: TrackMediaInfo

	// Prioritize downloads over streaming to save bandwidth
	if (downloads.length > 0 && downloads[0].path)
		trackMediaInfo = buildDownloadedTrack(downloads[0])
	/**
	 * Prioritize transcoding over direct play
	 * so that unsupported codecs playback properly
	 *
	 * (i.e. ALAC audio on Android)
	 */ else if (mediaInfo?.MediaSources && mediaInfo.MediaSources[0].TranscodingUrl) {
		trackMediaInfo = buildTranscodedTrack(
			api,
			item,
			mediaInfo!.MediaSources![0],
			mediaInfo?.PlaySessionId,
		)
	} else
		trackMediaInfo = {
			url: buildAudioApiUrl(api, item, deviceProfile),
			artwork: getTrackArtworkUrl(api, item),
			duration: convertRunTimeTicksToSeconds(item.RunTimeTicks!),
			sessionId: getValidSessionId(mediaInfo?.PlaySessionId),
			sourceType: 'stream',
		}

	// Only include headers when we have an API token (streaming cases). For downloaded tracks it's not needed.
	const headers = (api as Api | undefined)?.accessToken
		? { AUTHORIZATION: (api as Api).accessToken }
		: undefined

	// Build extraPayload - omit undefined values to avoid native serialization issues
	const extraPayload: Partial<TrackExtraPayload> = {}

	if (item.ArtistItems) extraPayload.artistItems = item.ArtistItems
	if (item.AlbumId) extraPayload.AlbumId = item.AlbumId
	if (item.AlbumId || item.Album) {
		extraPayload.albumItem = {
			...(item.AlbumId && { Id: item.AlbumId }),
			...(item.Album && { Album: item.Album }),
		}
	}
	if (trackMediaInfo.sourceType) extraPayload.sourceType = trackMediaInfo.sourceType
	if (item.OfficialRating) extraPayload.officialRating = item.OfficialRating
	if (item.CustomRating) extraPayload.customRating = item.CustomRating
	if (item.ImageBlurHashes && item.ImageBlurHashes.Primary)
		extraPayload.ImageBlurHash = getBlurhashFromDto(item)

	return {
		...(headers ? { headers } : {}),
		id: item.Id,
		title: item.Name,
		artist: formatArtistNames(item.Artists),
		album: item.Album,
		duration: trackMediaInfo.duration,
		url: trackMediaInfo.url,
		artwork: trackMediaInfo.artwork,
		...(Object.keys(extraPayload).length > 0 && { extraPayload }),
	} as TrackItem
}

function buildDownloadedTrack(downloadedTrack: JellifyDownload): TrackMediaInfo {
	// Safely build the image path - artwork is optional and may be undefined
	const imagePath = downloadedTrack.artwork
		? `file://${RNFS.DocumentDirectoryPath}/${downloadedTrack.artwork.split('/').pop()}`
		: undefined

	return {
		url: `file://${RNFS.DocumentDirectoryPath}/${downloadedTrack.path!.split('/').pop()}`,
		artwork: imagePath,
		duration: downloadedTrack.duration,
		sessionId: getValidSessionId(getTrackExtraPayload(downloadedTrack).sessionId),
		sourceType: 'download',
	}
}

function buildTranscodedTrack(
	api: Api,
	item: BaseItemDto,
	mediaSourceInfo: MediaSourceInfo,
	sessionId: string | null | undefined,
): TrackMediaInfo {
	const { RunTimeTicks } = item

	return {
		url: `${api.basePath}${mediaSourceInfo.TranscodingUrl}`,
		artwork: getTrackArtworkUrl(api, item),
		duration: convertRunTimeTicksToSeconds(RunTimeTicks ?? 0),
		sessionId: getValidSessionId(sessionId),
		sourceType: 'stream',
	}
}

/**
 * Builds a URL targeting the {@link AudioApi}, using data contained in the
 * {@link PlaybackInfoResponse}
 *
 * @param api The API instance
 * @param item The item to build the URL for
 * @param playbackInfo The playback info for the item
 * @returns The URL for the audio API
 */
function buildAudioApiUrl(
	api: Api,
	item: BaseItemDto,
	deviceProfile: DeviceProfile | undefined,
): string {
	const mediaInfo = queryClient.getQueryData(
		MediaInfoQueryKey({ api, deviceProfile, itemId: item.Id }),
	) as PlaybackInfoResponse | undefined

	let urlParams: Record<string, string> = {}
	let container: string = 'mp3'

	if (mediaSourceExists(mediaInfo)) {
		const mediaSource = mediaInfo!.MediaSources![0]

		urlParams = {
			playSessionId: getValidSessionId(mediaInfo?.PlaySessionId),
			startTimeTicks: '0',
			static: 'true',
		}

		if (mediaSource.Container! !== 'mpeg') container = mediaSource.Container!
	} else {
		urlParams = {
			playSessionId: uuid.v4(),
			StartTimeTicks: '0',
			static: 'true',
		}

		if (item.Container! !== 'mpeg') container = item.Container!
	}

	return `${api.basePath}/Audio/${item.Id!}/stream?${new URLSearchParams(urlParams)}`
}

function mediaSourceExists(mediaInfo: PlaybackInfoResponse | undefined): boolean {
	return (
		!isUndefined(mediaInfo) &&
		!isUndefined(mediaInfo.MediaSources) &&
		mediaInfo.MediaSources.length > 0
	)
}
