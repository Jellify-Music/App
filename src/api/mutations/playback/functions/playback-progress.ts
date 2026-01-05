import { runOnJS } from 'react-native-worklets'
import { getApi } from '../../../../stores'
import JellifyTrack from '../../../../types/JellifyTrack'
import { convertSecondsToRunTimeTicks } from '../../../../utils/mapping/ticks-to-seconds'
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api'
import { Api } from '@jellyfin/sdk'
import { nitroFetchOnWorklet } from 'react-native-nitro-fetch'

export default async function reportPlaybackProgress(
	api: Api | undefined,
	track: JellifyTrack,
	position: number,
): Promise<void> {
	'worklet'

	if (!api) return Promise.reject('API instance not set')

	const { sessionId, item } = track

	const url = `${api.basePath}/Sessions/Playing/Progress`

	try {
		await nitroFetchOnWorklet(
			url,
			{
				method: 'POST',
				body: JSON.stringify({
					playbackProgressInfo: {
						SessionId: sessionId,
						ItemId: item.Id,
						PositionTicks: convertSecondsToRunTimeTicks(position),
					},
				}),
				headers: {
					'Content-Type': 'application/json',
					Authorization: api.authorizationHeader,
				},
			},
			(response) => {
				'worklet'
			},
		)
	} catch (error) {
		console.error('Unable to report playback progress', error)
	}
}
