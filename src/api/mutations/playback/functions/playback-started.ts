import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api'
import { convertSecondsToRunTimeTicks } from '../../../../utils/mapping/ticks-to-seconds'
import { getApi } from '../../../../stores'
import { TrackItem } from 'react-native-nitro-player'
import { TrackExtraPayload } from '../../../../types/JellifyTrack'
import { captureError } from '../../../../utils/logging'
import LoggingContext from '../../../../utils/logging/enums'
import { getTrackMediaSourceInfo } from '../../../../utils/mapping/track-extra-payload'

export default async function reportPlaybackStarted(
	track: TrackItem,
	position?: number | undefined,
) {
	const api = getApi()

	if (!api) return Promise.reject('API instance not set')

	const { sessionId } = track.extraPayload as TrackExtraPayload

	// Get the device profile to determine the play method
	const mediaSourceInfo = getTrackMediaSourceInfo(track)

	try {
		await getPlaystateApi(api).reportPlaybackStart({
			playbackStartInfo: {
				PlaySessionId: sessionId,
				ItemId: track.id,
				PositionTicks: position ? convertSecondsToRunTimeTicks(position) : undefined,
				PlayMethod: mediaSourceInfo?.TranscodingUrl ? 'Transcode' : 'DirectPlay',
			},
		})
	} catch (error) {
		captureError(error, LoggingContext.PlaybackReporting, 'Unable to report playback started')
	}
}
