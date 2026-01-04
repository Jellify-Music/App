import { runOnJS } from 'react-native-worklets'
import { getApi } from '../../../../stores'
import JellifyTrack from '../../../../types/JellifyTrack'
import { convertSecondsToRunTimeTicks } from '../../../../utils/mapping/ticks-to-seconds'
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api'

async function reportPlaybackProgressJS(track: JellifyTrack, position: number): Promise<void> {
	const api = getApi()

	if (!api) return Promise.reject('API instance not set')

	const { sessionId, item } = track

	try {
		await getPlaystateApi(api).reportPlaybackProgress({
			playbackProgressInfo: {
				SessionId: sessionId,
				ItemId: item.Id,
				PositionTicks: convertSecondsToRunTimeTicks(position),
			},
		})
	} catch (error) {
		console.error('Unable to report playback progress', error)
	}
}

export default function reportPlaybackProgress(track: JellifyTrack, position: number) {
	'worklet'
	runOnJS(reportPlaybackProgressJS)(track, position)
}
