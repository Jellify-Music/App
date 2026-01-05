import JellifyTrack from '../../../../types/JellifyTrack'
import { convertSecondsToRunTimeTicks } from '../../../../utils/mapping/ticks-to-seconds'
import { Api } from '@jellyfin/sdk/lib/api'
import { nitroFetchOnWorklet } from 'react-native-nitro-fetch'

export default async function reportPlaybackStopped(
	api: Api | undefined,
	track: JellifyTrack,
	lastPosition?: number | undefined,
): Promise<void> {
	'worklet'
	if (!api) return Promise.reject('API instance not set')

	const { sessionId, item } = track

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
						PositionTicks: lastPosition
							? convertSecondsToRunTimeTicks(lastPosition)
							: undefined,
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
		console.error()
	}
}
