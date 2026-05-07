import { convertSecondsToRunTimeTicks } from '../../../../utils/mapping/ticks-to-seconds'
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api'
import { TrackItem } from 'react-native-nitro-player/lib/types/PlayerQueue'
import { TrackExtraPayload } from '../../../../types/JellifyTrack'
import { getApi } from '../../../../stores'
import { captureError } from '../../../../utils/logging'
import LoggingContext from '../../../../utils/logging/enums'
import { getTrackMediaSourceInfo } from '../../../../utils/mapping/track-extra-payload'

export default async function reportPlaybackProgress(
	track: TrackItem,
	position: number,
	isPaused?: boolean,
): Promise<void> {
	const api = getApi()

	if (!api) return Promise.reject('API instance not set')

	const { id } = track

	const { sessionId } = track.extraPayload as TrackExtraPayload

	const mediaSourceInfo = getTrackMediaSourceInfo(track)

	try {
		await getPlaystateApi(api).reportPlaybackProgress({
			playbackProgressInfo: {
				PlaySessionId: sessionId,
				ItemId: id,
				PositionTicks: convertSecondsToRunTimeTicks(position),
				IsPaused: isPaused,
				PlayMethod: mediaSourceInfo?.TranscodingUrl ? 'Transcode' : 'DirectPlay',
			},
		})
	} catch (error) {
		captureError(error, LoggingContext.PlaybackReporting, 'Unable to report playback progress')
	}
}
