import { Api } from '@jellyfin/sdk'
import JellifyTrack from '../../../../types/JellifyTrack'
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api'

export default async function reportPlaybackStarted(api: Api | undefined, track: JellifyTrack) {
	if (!api) return Promise.reject('API instance not set')

	const { sessionId, item } = track

	return await getPlaystateApi(api).reportPlaybackStart({
		playbackStartInfo: {
			SessionId: sessionId,
			ItemId: item.Id,
		},
	})
}
