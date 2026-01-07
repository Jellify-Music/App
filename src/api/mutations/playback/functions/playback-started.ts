import { Api } from '@jellyfin/sdk'
import JellifyTrack from '../../../../types/JellifyTrack'
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api'
import { getApi } from '../../../../stores'

export default async function reportPlaybackStarted(track: JellifyTrack) {
	const api = getApi()

	if (!api) return Promise.reject('API instance not set')

	const { sessionId, item } = track

	return await getPlaystateApi(api).reportPlaybackStart({
		playbackStartInfo: {
			SessionId: sessionId,
			ItemId: item.Id,
		},
	})
}
