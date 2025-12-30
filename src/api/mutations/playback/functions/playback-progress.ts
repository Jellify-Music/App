import { getApi } from '../../../../stores'
import JellifyTrack from '../../../../types/JellifyTrack'
import { convertSecondsToRunTimeTicks } from '../../../../utils/runtimeticks'
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api'
import { AxiosResponse } from 'axios'

export default async function reportPlaybackProgress(
	track: JellifyTrack,
	position: number,
): Promise<AxiosResponse<void, unknown>> {
	const api = getApi()

	if (!api) return Promise.reject('API instance not set')

	const { sessionId, item } = track

	return await getPlaystateApi(api).reportPlaybackProgress({
		playbackProgressInfo: {
			SessionId: sessionId,
			ItemId: item.Id,
			PositionTicks: convertSecondsToRunTimeTicks(position),
		},
	})
}
