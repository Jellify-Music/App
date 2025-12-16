import { Api } from '@jellyfin/sdk'
import JellifyTrack from '../../../../types/JellifyTrack'
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api'
import { MusicServerAdapter } from '../../../core/adapter'

export default async function reportPlaybackStarted(
	api: Api | undefined,
	track: JellifyTrack,
	adapter?: MusicServerAdapter,
) {
	// If adapter is provided, delegate to it (handles no-ops for Navidrome)
	if (adapter) {
		return adapter.reportPlaybackStart(track.item.Id!)
	}

	// Legacy Jellyfin path
	if (!api) return Promise.reject('API instance not set')

	const { sessionId, item } = track

	return await getPlaystateApi(api).reportPlaybackStart({
		playbackStartInfo: {
			SessionId: sessionId,
			ItemId: item.Id,
		},
	})
}
