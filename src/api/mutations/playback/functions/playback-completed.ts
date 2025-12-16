import { Api } from '@jellyfin/sdk'
import JellifyTrack from '../../../../types/JellifyTrack'
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api'
import { AxiosResponse } from 'axios'
import useJellifyStore from '../../../../stores'

export default async function reportPlaybackCompleted(
	api: Api | undefined,
	track: JellifyTrack,
): Promise<AxiosResponse<void, unknown> | void> {
	// Skip for Navidrome - it doesn't have playstate reporting endpoints
	const server = useJellifyStore.getState().server
	if (server?.backend === 'navidrome') return Promise.resolve()

	if (!api) return Promise.reject('API instance not set')

	const { sessionId, item, mediaSourceInfo } = track

	return await getPlaystateApi(api).reportPlaybackStopped({
		playbackStopInfo: {
			SessionId: sessionId,
			ItemId: item.Id,
			PositionTicks: mediaSourceInfo?.RunTimeTicks || item.RunTimeTicks,
		},
	})
}
