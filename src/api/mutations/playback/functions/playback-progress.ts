import JellifyTrack from '../../../../types/JellifyTrack'
import { convertSecondsToRunTimeTicks } from '../../../../utils/runtimeticks'
import { Api } from '@jellyfin/sdk'
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api'
import { AxiosResponse } from 'axios'
import useJellifyStore from '../../../../stores'

export default async function reportPlaybackProgress(
	api: Api | undefined,
	track: JellifyTrack,
	position: number,
): Promise<AxiosResponse<void, unknown> | void> {
	// Skip for Navidrome - it doesn't have playstate reporting endpoints
	const server = useJellifyStore.getState().server
	if (server?.backend === 'navidrome') return Promise.resolve()

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
