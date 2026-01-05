import JellifyTrack from '../../../../types/JellifyTrack'
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api'
import { Api } from '@jellyfin/sdk'
import { nitroFetchOnWorklet } from 'react-native-nitro-fetch'

export default async function reportPlaybackCompleted(
	api: Api | undefined,
	track: JellifyTrack,
): Promise<void> {
	'worklet'
	if (!api) return Promise.reject('API instance not set')

	const { sessionId, item, mediaSourceInfo } = track

	const url = `${api.basePath}/Sessions/Playing/Stopped`

	try {
		await nitroFetchOnWorklet(
			url,
			{
				method: 'POST',
				body: JSON.stringify({
					playbackStopInfo: {
						SessionId: sessionId,
						ItemId: item.Id,
						PositionTicks: mediaSourceInfo?.RunTimeTicks || item.RunTimeTicks,
					},
				}),
				headers: {
					'Content-Type': 'application/json',
					Authorization: api.authorizationHeader,
				},
			},
			(response) => {
				'worklet'
				console.log(`Playback completed report ${response.ok ? 'completed' : 'failed'}`)
			},
		)
	} catch (error) {
		console.error('Unable to report playback stopped', error)
	}
}
