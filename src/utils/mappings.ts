import {
	BaseItemDto,
	ImageType,
	PlaybackInfoResponse,
} from '@jellyfin/sdk/lib/generated-client/models'
import JellifyTrack from '../types/JellifyTrack'
import TrackPlayer, { Track, TrackType } from 'react-native-track-player'
import { QueuingType } from '../enums/queuing-type'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import { AudioApi, UniversalAudioApi } from '@jellyfin/sdk/lib/generated-client/api'
import { JellifyDownload } from '../types/JellifyDownload'
import { queryClient } from '../constants/query-client'
import { QueryKeys } from '../enums/query-keys'
import { Api } from '@jellyfin/sdk/lib/api'
import RNFS from 'react-native-fs'
import { DownloadQuality, StreamingQuality } from '../providers/Settings'
import { Platform } from 'react-native'
import { AudioQuality } from '../types/AudioQuality'

/**
 * The container that the Jellyfin server will attempt to transcode to
 *
 * This is set to `ts` (MPEG-TS), as that is what HLS relies upon
 *
 * Finamp and Jellyfin Web also have this set to `ts`
 * @see https://jmshrv.com/posts/jellyfin-api/#playback-in-the-case-of-music
 */
const transcodingContainer = 'ts'

/**
 * The type of track to use for the player
 *
 * iOS can use HLS, Android can't - and therefore uses Default
 *
 * Why? I'm not sure - someone way smarter than me can probably explain it
 * - Violet Caulfield - 2025-07-20
 */
const type = Platform.OS === 'ios' ? TrackType.HLS : TrackType.Default

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
export function mapDtoToTrack(
	api: Api,
	sessionId: string,
	item: BaseItemDto,
	downloadedTracks: JellifyDownload[],
	queuingType?: QueuingType,
	downloadQuality: DownloadQuality = 'medium',
	streamingQuality?: StreamingQuality,
): JellifyTrack {
	// Use streamingQuality for URL generation, fallback to downloadQuality for backward compatibility
	const qualityForStreaming = streamingQuality || downloadQuality
	const qualityParams = getQualityParams(qualityForStreaming)

	console.debug(
		`Mapping BaseItemDTO to Track object with streaming quality: ${qualityForStreaming}`,
	)

	const downloads = downloadedTracks.filter((download) => download.item.Id === item.Id)

	let url: string
	let image: string | undefined

	if (downloads.length > 0 && downloads[0].path) {
		url = `file://${RNFS.DocumentDirectoryPath}/${downloads[0].path.split('/').pop()}`
		image = `file://${RNFS.DocumentDirectoryPath}/${downloads[0].artwork?.split('/').pop()}`
	} else {
		url = buildAudioApiUrl(api, item, sessionId, qualityParams)
		image = item.AlbumId
			? getImageApi(api).getItemImageUrlById(item.AlbumId, ImageType.Primary)
			: undefined
	}

	console.debug(`URL for ${item.Name}: ${url}`)

	return {
		url,
		type,
		headers: {
			'X-Emby-Token': api.accessToken,
		},
		title: item.Name,
		album: item.Album,
		artist: item.Artists?.join(', '),
		duration: item.RunTimeTicks,
		artwork: image,
		item,
		QueuingType: queuingType ?? QueuingType.DirectlyQueued,
	} as JellifyTrack
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
	sessionId: string,
	qualityParams: AudioQuality | undefined,
): string {
	const urlParams = {
		playSessionId: sessionId,
		StartTimeTicks: '0',
		static: 'true',
		...qualityParams,
	}

	return `${api.basePath}/Audio/${item.Id!}/stream.${item.Container!}?${new URLSearchParams(urlParams)}`
}

/**
 * @deprecated Per Niels we should not be using the {@link UniversalAudioApi},
 * but rather the {@link AudioApi}.
 *
 * Builds a URL targeting the {@link UniversalAudioApi}, used as a fallback
 * when there is no {@link PlaybackInfoResponse} available
 *
 * @param api The API instance
 * @param item The item to build the URL for
 * @param sessionId The session ID
 * @param qualityParams The quality parameters
 * @returns The URL for the universal audio API
 */
function buildUniversalAudioApiUrl(
	api: Api,
	item: BaseItemDto,
	sessionId: string,
	qualityParams: Record<string, string>,
): string {
	const urlParams = {
		Container: item.Container!,
		TranscodingContainer: transcodingContainer,
		EnableRemoteMedia: 'true',
		EnableRedirection: 'true',
		api_key: api.accessToken,
		StartTimeTicks: '0',
		PlaySessionId: sessionId,
		...qualityParams,
	}
	return `${api.basePath}/Audio/${item.Id!}/universal?${new URLSearchParams(urlParams)}`
}
