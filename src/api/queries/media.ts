import { Api } from '@jellyfin/sdk'
import { PlaybackInfoResponse } from '@jellyfin/sdk/lib/generated-client/models'
import { getMediaInfoApi } from '@jellyfin/sdk/lib/utils/api'
import { isUndefined } from 'lodash'
import { JellifyUser } from '../../types/JellifyUser'
import { AudioQuality } from '../../types/AudioQuality'

export async function fetchMediaInfo(
	api: Api | undefined,
	user: JellifyUser | undefined,
	bitrate: AudioQuality | undefined,
	itemId: string,
): Promise<PlaybackInfoResponse> {
	console.debug(`Fetching media info of quality ${JSON.stringify(bitrate)}`)

	return new Promise((resolve, reject) => {
		if (isUndefined(api)) return reject('Client instance not set')
		if (isUndefined(user)) return reject('User instance not set')

		getMediaInfoApi(api)
			.getPostedPlaybackInfo({
				itemId: itemId!,
				userId: user.id,
				playbackInfoDto: {
					MaxAudioChannels: bitrate?.MaxAudioBitDepth
						? parseInt(bitrate.MaxAudioBitDepth)
						: undefined,
					MaxStreamingBitrate: bitrate?.AudioBitRate
						? parseInt(bitrate.AudioBitRate)
						: undefined,
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
