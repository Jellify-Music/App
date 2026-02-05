import JellifyTrack from '../../../../types/JellifyTrack'
import { convertSecondsToRunTimeTicks } from '../../../../utils/mapping/ticks-to-seconds'
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api'
import { Api } from '@jellyfin/sdk'

export default async function reportPlaybackProgress(
	api: Api | undefined,
	track: JellifyTrack,
	position: number,
): Promise<void> {
	if (!api) return Promise.reject('API instance not set')

	const { sessionId, id } = track

	try {
		await getPlaystateApi(api).reportPlaybackProgress({
			playbackProgressInfo: {
				SessionId: sessionId,
				ItemId: id,
				PositionTicks: convertSecondsToRunTimeTicks(position),
			},
		})
	} catch (error) {
		console.error('Unable to report playback progress', error)
	}
}
