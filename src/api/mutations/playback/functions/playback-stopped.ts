import JellifyTrack from '../../../../types/JellifyTrack'
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api'
import { getApi } from '../../../../stores'
import { convertSecondsToRunTimeTicks } from '../../../../utils/mapping/ticks-to-seconds'
import { runOnJS } from 'react-native-worklets'

async function reportPlaybackStoppedJS(track: JellifyTrack, lastPosition: number): Promise<void> {
	const api = getApi()

	if (!api) return Promise.reject('API instance not set')

	const { sessionId, item } = track

	try {
		await getPlaystateApi(api).reportPlaybackStopped({
			playbackStopInfo: {
				SessionId: sessionId,
				ItemId: item.Id,
				PositionTicks: convertSecondsToRunTimeTicks(lastPosition),
			},
		})
	} catch (error) {
		console.error()
	}
}

export default function reportPlaybackStopped(track: JellifyTrack, lastPosition: number) {
	'worklet'
	runOnJS(reportPlaybackStoppedJS)(track, lastPosition)
}
