import {
	BaseItemDto,
	ImageType,
	PlaybackInfoResponse,
} from '@jellyfin/sdk/lib/generated-client/models'
import JellifyTrack from '../types/JellifyTrack'
import { TrackType } from 'react-native-track-player'
import { QueuingType } from '../enums/queuing-type'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import { JellifyDownload } from '../types/JellifyDownload'
import { queryClient } from '../constants/query-client'
import { QueryKeys } from '../enums/query-keys'
import { Api } from '@jellyfin/sdk/lib/api'
import RNFS from 'react-native-fs'
import { DownloadQuality, StreamingQuality } from '../providers/Settings'
import { Platform } from 'react-native'

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
function getQualityParams(quality: DownloadQuality | StreamingQuality): { [key: string]: string } {
	switch (quality) {
		case 'original':
			return {}
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
 * A mapper function that can be used to get a RNTP `Track` compliant object
 * from a Jellyfin server `BaseItemDto`. Applies a queuing type to the track
 * object so that it can be referenced later on for determining where to place
 * the track in the queue
 *
 * @param item The `BaseItemDto` of the track
 * @param queuingType The type of queuing we are performing
 * @param downloadQuality The quality to use for downloads (used only when saving files)
 * @param streamingQuality The quality to use for streaming (used for playback URLs)
 * @returns A `JellifyTrack`, which represents a Jellyfin library track queued in the player
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
		const PlaybackInfoResponse = queryClient.getQueryData([
			QueryKeys.MediaSources,
			item.Id!,
		]) as PlaybackInfoResponse | undefined

		if (
			PlaybackInfoResponse &&
			PlaybackInfoResponse.MediaSources &&
			PlaybackInfoResponse.MediaSources[0].TranscodingUrl
		)
			url = PlaybackInfoResponse.MediaSources![0].TranscodingUrl
		else url = `${api.basePath}/Audio/${item.Id!}/universal?${new URLSearchParams(urlParams)}`

		image = item.AlbumId
			? getImageApi(api).getItemImageUrlById(item.AlbumId, ImageType.Primary)
			: undefined
	}

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
