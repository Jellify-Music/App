import JellifyTrack from '../../../../types/JellifyTrack'
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api'
import { convertSecondsToRunTimeTicks } from '../../../../utils/mapping/ticks-to-seconds'
import { Api } from '@jellyfin/sdk'

export default async function reportPlaybackStarted(
	api: Api | undefined,
	track: JellifyTrack,
	position?: number | undefined,
) {
	if (!api) return Promise.reject('API instance not set')

	const { sessionId, item } = track

	try {
		await getPlaystateApi(api).reportPlaybackStart({
			playbackStartInfo: {
				SessionId: sessionId,
				ItemId: item.Id,
				PositionTicks: position ? convertSecondsToRunTimeTicks(position) : undefined,
			},
		})
	} catch (error) {
		console.error('Unable to report playback started', error)
	}
}
