import JellifyTrack from '../../../../types/JellifyTrack'
import { convertSecondsToRunTimeTicks } from '../../../../utils/mapping/ticks-to-seconds'
import { Api } from '@jellyfin/sdk'
import { nitroFetchOnWorklet } from 'react-native-nitro-fetch'

export default async function reportPlaybackStarted(
	api: Api | undefined,
	track: JellifyTrack,
	position?: number | undefined,
) {
	if (!api) return Promise.reject('API instance not set')

	const { sessionId, item } = track

	const url = `${api.basePath}/Sessions/Playing`

	try {
		await nitroFetchOnWorklet(
			url,
			{
				method: 'POST',
				body: JSON.stringify({
					playbackStartInfo: {
						SessionId: sessionId,
						ItemId: item.Id,
						PositionTicks: position
							? convertSecondsToRunTimeTicks(position)
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
		console.error('Unable to report playback started', error)
	}
}
