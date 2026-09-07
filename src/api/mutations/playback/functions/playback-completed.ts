import { TrackExtraPayload } from '../../../../types/JellifyTrack'
import { SessionApi } from '@jellyfin/sdk/lib/generated-client'
import { TrackItem } from 'react-native-nitro-player'
import getTrackDto, { getTrackMediaSourceInfo } from '../../../../utils/mapping/track-extra-payload'
import { getApi } from '../../../../stores/auth/utils'
import { captureError } from '../../../../utils/logging'
import LoggingContext from '../../../../utils/logging/enums'

export default async function reportPlaybackCompleted(track: TrackItem): Promise<void> {
	const api = getApi()

	if (!api) return Promise.reject('API instance not set')

	const { id } = track
	const { sessionId } = track.extraPayload as TrackExtraPayload

	const item = getTrackDto(track)
	const mediaSourceInfo = getTrackMediaSourceInfo(track)

	const sessionApi = new SessionApi(api.configuration, api.basePath, api.axiosInstance)

	try {
		await sessionApi.reportPlaybackStopped({
			playbackStopInfo: {
				PlaySessionId: sessionId,
				ItemId: id,
				PositionTicks: mediaSourceInfo?.RunTimeTicks || item?.RunTimeTicks,
			},
		})
	} catch (error) {
		captureError(error, LoggingContext.PlaybackReporting, 'Unable to report playback completed')
	}
}
