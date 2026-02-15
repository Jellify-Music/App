import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api'
import { convertSecondsToRunTimeTicks } from '../../../../utils/mapping/ticks-to-seconds'
import { TrackItem } from 'react-native-nitro-player'
import { TrackExtraPayload } from '../../../../types/JellifyTrack'
import { getApi } from '../../../../stores'

export default async function reportPlaybackStopped(
	track: TrackItem,
	lastPosition?: number | undefined,
): Promise<void> {
	const api = getApi()

	if (!api) return Promise.reject('API instance not set')

	const { sessionId } = track.extraPayload as TrackExtraPayload
	const { id } = track

	try {
		await getPlaystateApi(api).reportPlaybackStopped({
			playbackStopInfo: {
				SessionId: sessionId,
				ItemId: id,
				PositionTicks: lastPosition
					? convertSecondsToRunTimeTicks(lastPosition)
					: undefined,
			},
		})
	} catch (error) {
		console.error('Unable to report playback stopped', error)
	}
}
