import {
	BaseItemDto,
	ImageType,
	PlaybackInfoResponse,
} from '@jellyfin/sdk/lib/generated-client/models'
import JellifyTrack from '../types/JellifyTrack'
import { RatingType, TrackType } from 'react-native-track-player'
import { QueuingType } from '../enums/queuing-type'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import { isUndefined } from 'lodash'
import { JellifyDownload } from '../types/JellifyDownload'
import { queryClient } from '../constants/query-client'
import { QueryKeys } from '../enums/query-keys'
import { Api } from '@jellyfin/sdk/lib/api'
import RNFS from 'react-native-fs'
import { DownloadQuality, StreamingQuality } from '../providers/Settings'

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
	const isFavorite = !isUndefined(item.UserData) && (item.UserData.IsFavorite ?? false)

	const downloads = downloadedTracks.filter((download) => download.item.Id === item.Id)

	let url: string

	// Quality-aware URL selection logic
	if (downloads.length > 0 && downloads[0].path) {
		// Check if downloaded file quality matches or exceeds desired streaming quality
		const downloadedQuality = downloads[0].quality || 'medium' // Default to medium if not specified
		const shouldUseDownloaded = shouldUseDownloadedFile(downloadedQuality, qualityForStreaming)

		if (shouldUseDownloaded) {
			url = `file://${RNFS.DocumentDirectoryPath}/${downloads[0].path.split('/').pop()}`
		} else {
			// Use streaming URL even though file exists, for higher quality
			console.debug(
				`Using streaming for higher quality: downloaded=${downloadedQuality}, streaming=${qualityForStreaming}`,
			)
			url = generateStreamingUrl(api, item, urlParams)
		}
	} else {
		url = generateStreamingUrl(api, item, urlParams)
	}

	console.debug(url.length)
	return {
		url,
		type: TrackType.Default,
		headers: {
			'X-Emby-Token': api.accessToken,
		},
		title: item.Name,
		album: item.Album,
		artist: item.Artists?.join(', '),
		duration: item.RunTimeTicks,
		artwork: item.AlbumId
			? getImageApi(api).getItemImageUrlById(item.AlbumId, ImageType.Primary, {
					width: 300,
					height: 300,
				})
			: undefined,

		rating: isFavorite ? RatingType.Heart : undefined,
		item,
		QueuingType: queuingType ?? QueuingType.DirectlyQueued,
	} as JellifyTrack
}

/**
 * Determines if a downloaded file should be used based on quality comparison
 * @param downloadedQuality Quality of the downloaded file
 * @param streamingQuality Desired streaming quality
 * @returns True if downloaded file quality is sufficient
 */
function shouldUseDownloadedFile(
	downloadedQuality: DownloadQuality | StreamingQuality,
	streamingQuality: DownloadQuality | StreamingQuality,
): boolean {
	const qualityOrder = ['low', 'medium', 'high', 'original']
	const downloadedIndex = qualityOrder.indexOf(downloadedQuality)
	const streamingIndex = qualityOrder.indexOf(streamingQuality)

	// Use downloaded file if it's equal or higher quality than requested streaming quality
	return downloadedIndex >= streamingIndex
}

/**
 * Generates streaming URL with proper transcoding support
 * @param api Jellyfin API instance
 * @param item Track item
 * @param urlParams URL parameters with quality settings
 * @returns Streaming URL
 */
function generateStreamingUrl(
	api: Api,
	item: BaseItemDto,
	urlParams: { [key: string]: string },
): string {
	// First try to get transcoding URL from cached PlaybackInfoResponse
	const PlaybackInfoResponse = queryClient.getQueryData([QueryKeys.MediaSources, item.Id!]) as
		| PlaybackInfoResponse
		| undefined

	if (
		PlaybackInfoResponse &&
		PlaybackInfoResponse.MediaSources &&
		PlaybackInfoResponse.MediaSources[0].TranscodingUrl
	) {
		// Use transcoding URL but ensure it has quality parameters
		const transcodingUrl = PlaybackInfoResponse.MediaSources[0].TranscodingUrl
		console.debug('Using transcoding URL from PlaybackInfoResponse')
		return transcodingUrl
	}

	// Fallback to universal URL with quality parameters
	const universalUrl = `${api.basePath}/Audio/${item.Id!}/universal?${new URLSearchParams(urlParams)}`
	console.debug('Using universal URL with quality parameters')
	return universalUrl
}
