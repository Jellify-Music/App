import {
	BaseItemDto,
	DeviceProfile,
	ImageType,
	MediaSourceInfo,
	PlaybackInfoResponse,
} from '@jellyfin/sdk/lib/generated-client/models'
import JellifyTrack from '../types/JellifyTrack'
import TrackPlayer, { Track, TrackType } from 'react-native-track-player'
import { QueuingType } from '../enums/queuing-type'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import { AudioApi } from '@jellyfin/sdk/lib/generated-client/api'
import { JellifyDownload } from '../types/JellifyDownload'
import { Api } from '@jellyfin/sdk/lib/api'
import { AudioQuality } from '../types/AudioQuality'
import { queryClient } from '../constants/query-client'
import { isUndefined } from 'lodash'
import uuid from 'react-native-uuid'
import { convertRunTimeTicksToSeconds } from './runtimeticks'
import { DownloadQuality } from '../stores/settings/usage'
import MediaInfoQueryKey from '../api/queries/media/keys'
import StreamingQuality from '../enums/audio-quality'
import { getAudioCache } from '../api/mutations/download/offlineModeUtils'
import RNFS from 'react-native-fs'

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

type TrackMediaInfo = Pick<
	JellifyTrack,
	'url' | 'image' | 'duration' | 'item' | 'mediaSourceInfo' | 'sessionId' | 'sourceType' | 'type'
>

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
export function mapDtoToTrack(
	api: Api,
	item: BaseItemDto,
	deviceProfile: DeviceProfile,
	queuingType?: QueuingType,
): JellifyTrack {
	const downloadedTracks = getAudioCache()
	const downloads = downloadedTracks.filter((download) => download.item.Id === item.Id)

	const mediaInfo = queryClient.getQueryData(
		MediaInfoQueryKey({ api, deviceProfile, itemId: item.Id }),
	) as PlaybackInfoResponse | undefined

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
			image: getTrackArtworkUrl(api, item),
			duration: convertRunTimeTicksToSeconds(item.RunTimeTicks!),
			item,
			sessionId: mediaInfo?.PlaySessionId,
			mediaSourceInfo:
				mediaInfo && mediaInfo.MediaSources ? mediaInfo.MediaSources[0] : undefined,
			sourceType: 'stream',
			type: TrackType.Default,
		}

	// Only include headers when we have an API token (streaming cases). For downloaded tracks it's not needed.
	const headers = (api as Api | undefined)?.accessToken
		? { 'X-Emby-Token': (api as Api).accessToken }
		: undefined

	return {
		...(headers ? { headers } : {}),
		...trackMediaInfo,
		title: item.Name,
		album: item.Album,
		artist: item.Artists?.join(' • '),
		artwork: trackMediaInfo.image,
		QueuingType: queuingType ?? QueuingType.DirectlyQueued,
	} as JellifyTrack
}

function ensureFileUri(path?: string): string | undefined {
	if (!path) return undefined
	return path.startsWith('file://') ? path : `file://${path}`
}

function buildDownloadedTrack(downloadedTrack: JellifyDownload): TrackMediaInfo {
	// Safely build the image path - artwork is optional and may be undefined
	const imagePath = downloadedTrack.artwork
		? `file://${RNFS.DocumentDirectoryPath}/${downloadedTrack.artwork.split('/').pop()}`
		: undefined

	return {
		type: TrackType.Default,
		url: `file://${RNFS.DocumentDirectoryPath}/${downloadedTrack.path!.split('/').pop()}`,
		image: imagePath,
		duration: convertRunTimeTicksToSeconds(
			downloadedTrack.mediaSourceInfo?.RunTimeTicks || downloadedTrack.item.RunTimeTicks || 0,
		),
		item: downloadedTrack.item,
		mediaSourceInfo: downloadedTrack.mediaSourceInfo,
		sessionId: getValidSessionId(downloadedTrack.sessionId),
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
		type: TrackType.HLS,
		url: `${api.basePath}${mediaSourceInfo.TranscodingUrl}`,
		image: getTrackArtworkUrl(api, item),
		duration: convertRunTimeTicksToSeconds(RunTimeTicks ?? 0),
		mediaSourceInfo,
		item,
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
