import JellifyTrack from '../../../../types/JellifyTrack'
import { convertSecondsToRunTimeTicks } from '../../../../utils/runtimeticks'
import { Api } from '@jellyfin/sdk'
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api'
import { AxiosResponse } from 'axios'
import { MusicServerAdapter } from '../../../core/adapter'

export default async function reportPlaybackProgress(
	api: Api | undefined,
	track: JellifyTrack,
	position: number,
	adapter?: MusicServerAdapter,
): Promise<AxiosResponse<void, unknown> | void> {
	// If adapter is provided, delegate to it (handles no-ops for Navidrome)
	if (adapter) {
		return adapter.reportPlaybackProgress(track.item.Id!, position)
	}

	// Legacy Jellyfin path
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
