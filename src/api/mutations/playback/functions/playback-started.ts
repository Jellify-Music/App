import JellifyTrack from '../../../../types/JellifyTrack'
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api'
import { getApi } from '../../../../stores'
import { convertSecondsToRunTimeTicks } from '../../../../utils/mapping/ticks-to-seconds'
import { runOnJS } from 'react-native-worklets'

async function reportPlaybackStartedJS(track: JellifyTrack, position: number | undefined) {
	'worklet'
	const api = getApi()

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

export default function reportPlaybackStarted(track: JellifyTrack, position?: number | undefined) {
	runOnJS(reportPlaybackStartedJS)(track, position)
}
