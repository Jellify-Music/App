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
			image: item.AlbumId
				? getImageApi(api).getItemImageUrlById(item.AlbumId, ImageType.Primary)
				: undefined,
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
	return {
		type: TrackType.Default,
		url: ensureFileUri(downloadedTrack.path) ?? downloadedTrack.url,
		image: ensureFileUri(downloadedTrack.artwork),
		duration: convertRunTimeTicksToSeconds(
			downloadedTrack.mediaSourceInfo?.RunTimeTicks || downloadedTrack.item.RunTimeTicks || 0,
		),
		item: downloadedTrack.item,
		mediaSourceInfo: downloadedTrack.mediaSourceInfo,
		sessionId: downloadedTrack.sessionId,
		sourceType: 'download',
	}
}

function buildTranscodedTrack(
	api: Api,
	item: BaseItemDto,
	mediaSourceInfo: MediaSourceInfo,
	sessionId: string | null | undefined,
): TrackMediaInfo {
	const { AlbumId, RunTimeTicks } = item

	return {
		type: TrackType.HLS,
		url: `${api.basePath}${mediaSourceInfo.TranscodingUrl}`,
		image: AlbumId
			? getImageApi(api).getItemImageUrlById(AlbumId, ImageType.Primary)
			: undefined,
		duration: convertRunTimeTicksToSeconds(RunTimeTicks ?? 0),
		mediaSourceInfo,
		item,
		sessionId,
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
	console.debug(
		`Mapping BaseItemDTO to Track object with streaming quality: ${deviceProfile?.Name}`,
	)
	const mediaInfo = queryClient.getQueryData(
		MediaInfoQueryKey({ api, deviceProfile, itemId: item.Id }),
	) as PlaybackInfoResponse | undefined

	let urlParams: Record<string, string> = {}
	let container: string = 'mp3'

	if (mediaSourceExists(mediaInfo)) {
		const mediaSource = mediaInfo!.MediaSources![0]

		urlParams = {
			playSessionId: mediaInfo?.PlaySessionId ?? uuid.v4(),
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
