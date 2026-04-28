import { captureInfo, LoggingContext } from '../../../../utils/logging'
import { getApi } from '../../../../stores'
import { DeviceProfile, PlaybackInfoResponse } from '@jellyfin/sdk/lib/generated-client/models'
import { getMediaInfoApi } from '@jellyfin/sdk/lib/utils/api'
import { isUndefined } from 'lodash'

export async function fetchMediaInfo(
	deviceProfile: DeviceProfile | undefined,
	itemId: string | null | undefined,
	isQualityLimited: boolean,
): Promise<PlaybackInfoResponse> {
	const api = getApi()

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
					// When quality is limited, disable DirectStream so Jellyfin cannot
					// remux lossless audio without re-encoding — forcing a full transcode.
					EnableDirectStream: !isQualityLimited,
					EnableTranscoding: true,
					DeviceProfile: deviceProfile,
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
