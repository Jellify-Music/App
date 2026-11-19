import { SessionApi } from '@jellyfin/sdk/lib/generated-client'
import { convertSecondsToRunTimeTicks } from '../../../../utils/mapping/ticks-to-seconds'
import { TrackItem } from 'react-native-nitro-player'
import { TrackExtraPayload } from '../../../../types/JellifyTrack'
import { getApi } from '../../../../stores/auth/utils'
import { captureError } from '../../../../utils/logging'
import LoggingContext from '../../../../utils/logging/enums'

export default async function reportPlaybackStopped(
	track: TrackItem,
	lastPosition?: number | undefined,
): Promise<void> {
	const api = getApi()

	if (!api) return Promise.reject('API instance not set')

	const { sessionId } = track.extraPayload as TrackExtraPayload
	const { id } = track

	const sessionApi = new SessionApi(api.configuration, api.basePath, api.axiosInstance)

	try {
		await sessionApi.reportPlaybackStopped({
			playbackStopInfo: {
				PlaySessionId: sessionId,
				ItemId: id,
				PositionTicks: lastPosition
					? convertSecondsToRunTimeTicks(lastPosition)
					: undefined,
			},
		})
	} catch (error) {
		captureError(error, LoggingContext.PlaybackReporting, 'Unable to report playback stopped')
	}
}
