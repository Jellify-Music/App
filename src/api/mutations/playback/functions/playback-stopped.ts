import { Api } from '@jellyfin/sdk'
import JellifyTrack from '../../../../types/JellifyTrack'
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api'
import { AxiosResponse } from 'axios'
import { MusicServerAdapter } from '../../../core/adapter'

export default async function reportPlaybackStopped(
	api: Api | undefined,
	track: JellifyTrack,
	position: number = 0,
	adapter?: MusicServerAdapter,
): Promise<AxiosResponse<void, unknown> | void> {
	// If adapter is provided, delegate to it (handles no-ops for Navidrome)
	if (adapter) {
		return adapter.reportPlaybackEnd(track.item.Id!, position, false)
	}

	// Legacy Jellyfin path
	if (!api) return Promise.reject('API instance not set')

	const { sessionId, item } = track

	return await getPlaystateApi(api).reportPlaybackStopped({
		playbackStopInfo: {
			SessionId: sessionId,
			ItemId: item.Id,
		},
	})
}
