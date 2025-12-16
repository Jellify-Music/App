import { Api } from '@jellyfin/sdk'
import JellifyTrack from '../../../../types/JellifyTrack'
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api'
import { AxiosResponse } from 'axios'
import { MusicServerAdapter } from '../../../core/adapter'
import { convertRunTimeTicksToSeconds } from '../../../../utils/runtimeticks'

export default async function reportPlaybackCompleted(
	api: Api | undefined,
	track: JellifyTrack,
	adapter?: MusicServerAdapter,
): Promise<AxiosResponse<void, unknown> | void> {
	// If adapter is provided, delegate to it (handles scrobbling for Navidrome)
	if (adapter) {
		const duration = track.mediaSourceInfo?.RunTimeTicks
			? convertRunTimeTicksToSeconds(track.mediaSourceInfo.RunTimeTicks)
			: track.item.RunTimeTicks
				? convertRunTimeTicksToSeconds(track.item.RunTimeTicks)
				: 0
		return adapter.reportPlaybackEnd(track.item.Id!, duration, true)
	}

	// Legacy Jellyfin path
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
