import { convertSecondsToRunTimeTicks } from '../../../../utils/mapping/ticks-to-seconds'
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api'
import { Api } from '@jellyfin/sdk'
import { TrackItem } from 'react-native-nitro-player/lib/types/PlayerQueue'
import { TrackExtraPayload } from '../../../../types/JellifyTrack'

export default async function reportPlaybackProgress(
	api: Api | undefined,
	track: TrackItem,
	position: number,
): Promise<void> {
	if (!api) return Promise.reject('API instance not set')

	const { id } = track

	const { sessionId } = track.extraPayload as TrackExtraPayload

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
