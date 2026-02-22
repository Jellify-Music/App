import { TrackExtraPayload } from '../../../../types/JellifyTrack'
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api'
import { TrackItem } from 'react-native-nitro-player'
import getTrackDto, { getTrackMediaSourceInfo } from '../../../../utils/mapping/track-extra-payload'
import { getApi } from '../../../../stores'

export default async function reportPlaybackCompleted(track: TrackItem): Promise<void> {
	const api = getApi()

	if (!api) return Promise.reject('API instance not set')

	const { id } = track
	const { sessionId } = track.extraPayload as TrackExtraPayload

	const item = getTrackDto(track)
	const mediaSourceInfo = getTrackMediaSourceInfo(track)

	try {
		await getPlaystateApi(api).reportPlaybackStopped({
			playbackStopInfo: {
				SessionId: sessionId,
				ItemId: id,
				PositionTicks: mediaSourceInfo?.RunTimeTicks || item?.RunTimeTicks,
			},
		})
	} catch (error) {
		console.error('Unable to report playback stopped', error)
	}
}
