import { Api } from '@jellyfin/sdk'
import { DeviceProfile, PlaybackInfoResponse } from '@jellyfin/sdk/lib/generated-client/models'
import { getMediaInfoApi } from '@jellyfin/sdk/lib/utils/api'
import { isUndefined } from 'lodash'

export async function fetchMediaInfo(
	api: Api | undefined,
	deviceProfile: DeviceProfile | undefined,
	itemId: string | null | undefined,
): Promise<PlaybackInfoResponse> {
	console.debug(`Fetching media info of with ${deviceProfile?.Name} profile`)

	return new Promise((resolve, reject) => {
		if (isUndefined(api)) return reject('Client instance not set')

		getMediaInfoApi(api)
			.getPostedPlaybackInfo({
				itemId: itemId!,
				playbackInfoDto: {
					DeviceProfile: deviceProfile,
				},
			})
			.then(({ data }) => {
				console.debug('Received media info response')
				resolve(data)
			})
			.catch((error) => {
				reject(error)
			})
	})
}
