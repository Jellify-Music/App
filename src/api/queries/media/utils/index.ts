import { captureInfo, LoggingContext } from '../../../../utils/logging'
import { getApi } from '../../../../stores'
import { DeviceProfile, PlaybackInfoResponse } from '@jellyfin/sdk/lib/generated-client/models'
import { getMediaInfoApi } from '@jellyfin/sdk/lib/utils/api'
import { isUndefined } from 'lodash'

export async function fetchMediaInfo(
	deviceProfile: DeviceProfile | undefined,
	itemId: string | null | undefined,
): Promise<PlaybackInfoResponse> {
	const api = getApi()

	// MusicStreamingTranscodingBitrate is only set for non-original quality profiles.
	// When it's present, DirectStream must be disabled so Jellyfin can't remux
	// lossless audio without re-encoding — forcing a full static transcode.
	const isQualityLimited = deviceProfile?.MusicStreamingTranscodingBitrate != null

	captureInfo(
		LoggingContext.MediaInfo,
		`Fetching media info of item ${itemId} for device profile ${deviceProfile?.Name}`,
	)

	return new Promise((resolve, reject) => {
		if (isUndefined(api)) return reject('Client instance not set')

		getMediaInfoApi(api)
			.getPostedPlaybackInfo({
				itemId: itemId!,
				playbackInfoDto: {
					EnableDirectPlay: true,
					EnableDirectStream: !isQualityLimited,
					EnableTranscoding: true,
					DeviceProfile: deviceProfile,
					MaxStreamingBitrate: deviceProfile?.MaxStaticMusicBitrate,
				},
			})
			.then(({ data }) => {
				console.debug(`Playback info response: ${JSON.stringify(data)}`)
				resolve(data)
			})
			.catch((error) => {
				reject(error)
			})
	})
}
