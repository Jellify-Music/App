import JellifyTrack from '../../../../types/JellifyTrack'
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api'
import { Api } from '@jellyfin/sdk'

export default async function reportPlaybackCompleted(
	api: Api | undefined,
	track: JellifyTrack,
): Promise<void> {
	if (!api) return Promise.reject('API instance not set')

	const { sessionId, item, mediaSourceInfo, id } = track

	try {
		await getPlaystateApi(api).reportPlaybackStopped({
			playbackStopInfo: {
				SessionId: sessionId,
				ItemId: id,
				PositionTicks: mediaSourceInfo?.RunTimeTicks || item.RunTimeTicks,
			},
		})
	} catch (error) {
		console.error('Unable to report playback stopped', error)
	}
}
