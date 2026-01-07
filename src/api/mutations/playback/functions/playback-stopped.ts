import JellifyTrack from '../../../../types/JellifyTrack'
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api'
import { AxiosResponse } from 'axios'
import { getApi } from '../../../../stores'

export default async function reportPlaybackStopped(
	track: JellifyTrack,
): Promise<AxiosResponse<void, unknown>> {
	const api = getApi()

	if (!api) return Promise.reject('API instance not set')

	const { sessionId, item } = track

	return await getPlaystateApi(api).reportPlaybackStopped({
		playbackStopInfo: {
			SessionId: sessionId,
			ItemId: item.Id,
		},
	})
}
