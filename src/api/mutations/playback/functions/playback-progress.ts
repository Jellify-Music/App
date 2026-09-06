import { convertSecondsToRunTimeTicks } from '../../../../utils/mapping/ticks-to-seconds'
import { PlayMethod, SessionApi } from '@jellyfin/sdk/lib/generated-client'
import { TrackItem } from 'react-native-nitro-player/lib/types/PlayerQueue'
import { TrackExtraPayload } from '../../../../types/JellifyTrack'
import { getApi } from '../../../../stores/auth/utils'
import { captureError } from '../../../../utils/logging'
import LoggingContext from '../../../../utils/logging/enums'
import { getTrackMediaSourceInfo } from '../../../../utils/mapping/track-extra-payload'
import { throttle } from 'lodash'
import { REPORTING_INTERVAL } from '../../../../configs/player/reporting.config'

const reportPlaybackProgress = throttle(reportPlaybackProgressInner, REPORTING_INTERVAL, {
	leading: true,
	trailing: false,
})

async function reportPlaybackProgressInner(
	track: TrackItem,
	position: number,
	isPaused?: boolean,
): Promise<void> {
	const api = getApi()

	if (!api) return Promise.reject('API instance not set')

	const { id } = track

	const { sessionId } = track.extraPayload as TrackExtraPayload

	const mediaSourceInfo = getTrackMediaSourceInfo(track)

	const sessionApi = new SessionApi(api.configuration, api.basePath, api.axiosInstance)

	try {
		await sessionApi.reportPlaybackProgress({
			playbackProgressInfo: {
				PlaySessionId: sessionId,
				ItemId: id,
				PositionTicks: convertSecondsToRunTimeTicks(position),
				IsPaused: isPaused,
				PlayMethod: mediaSourceInfo?.TranscodingUrl
					? PlayMethod.Transcode
					: PlayMethod.DirectPlay,
			},
		})
	} catch (error) {
		captureError(error, LoggingContext.PlaybackReporting, 'Unable to report playback progress')
	}
}

export default reportPlaybackProgress
