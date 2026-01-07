import JellifyTrack from '../../../../types/JellifyTrack'
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api'
import { convertSecondsToRunTimeTicks } from '../../../../utils/mapping/ticks-to-seconds'
import { Api } from '@jellyfin/sdk/lib/api'

export default async function reportPlaybackStopped(
	api: Api | undefined,
	track: JellifyTrack,
	lastPosition?: number | undefined,
): Promise<void> {
	if (!api) return Promise.reject('API instance not set')

	const { sessionId, item } = track

	try {
		await getPlaystateApi(api).reportPlaybackStopped({
			playbackStopInfo: {
				SessionId: sessionId,
				ItemId: item.Id,
				PositionTicks: lastPosition
					? convertSecondsToRunTimeTicks(lastPosition)
					: undefined,
			},
		})
	} catch (error) {
		console.error('Unable to report playback stopped', error)
	}
}
