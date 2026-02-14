import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api'
import { convertSecondsToRunTimeTicks } from '../../../../utils/mapping/ticks-to-seconds'
import { getApi } from '../../../../stores'
import { TrackItem } from 'react-native-nitro-player'
import { TrackExtraPayload } from '../../../../types/JellifyTrack'

export default async function reportPlaybackStarted(
	track: TrackItem,
	position?: number | undefined,
) {
	const api = getApi()

	if (!api) return Promise.reject('API instance not set')

	const { sessionId } = track.extraPayload as TrackExtraPayload

	try {
		await getPlaystateApi(api).reportPlaybackStart({
			playbackStartInfo: {
				SessionId: sessionId,
				ItemId: track.id,
				PositionTicks: position ? convertSecondsToRunTimeTicks(position) : undefined,
			},
		})
	} catch (error) {
		console.error('Unable to report playback started', error)
	}
}
