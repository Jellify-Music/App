import ensureMediaInfoQuery from '../../api/queries/media/queries'
import { PlaybackInfoResponse } from '@jellyfin/sdk/lib/generated-client/models/playback-info-response'
import { TrackItem } from 'react-native-nitro-player'
import buildAudioApiUrl, { buildTranscodedAudioApiUrl } from '../mapping/item-to-audio-api-url'
import getTrackDto from '../mapping/track-extra-payload'
import { convertRunTimeTicksToSeconds } from '../mapping/ticks-to-seconds'
import { SourceType } from '@/src/types/JellifyTrack'

export default async function resolveTrackUrls(
	trackItems: TrackItem[],
	source: SourceType,
): Promise<TrackItem[]> {
	const playbackInfoPromises = trackItems.map((track) => ensureMediaInfoQuery(track.id, source))

	const playbackInfoResponses = await Promise.allSettled(playbackInfoPromises)

	const playbackInfoEntries = playbackInfoResponses.map((result, index) => {
		if (result.status === 'fulfilled') {
			return [trackItems[index].id, result.value] as [string, PlaybackInfoResponse]
		} else {
			console.warn(
				`Failed to fetch playback info for track ${trackItems[index].id}: ${result.reason}`,
			)
			return [trackItems[index].id, undefined] as [string, PlaybackInfoResponse | undefined]
		}
	})

	const playbackInfoById = new Map(playbackInfoEntries)

	const updatedTracks = trackItems.map((track) => {
		const playbackInfo = playbackInfoById.get(track.id)

		if (!playbackInfo) {
			console.warn(`No playback info found for track ${track.id}`)
			return track
		}

		const transcodingUrl = playbackInfo.MediaSources?.[0]?.TranscodingUrl

		return {
			...track,
			url: transcodingUrl
				? buildTranscodedAudioApiUrl(playbackInfo)
				: buildAudioApiUrl(getTrackDto(track)!, playbackInfo),
			duration: playbackInfo.MediaSources?.[0]?.RunTimeTicks
				? convertRunTimeTicksToSeconds(playbackInfo.MediaSources[0].RunTimeTicks)
				: track.duration,
			extraPayload: {
				...track.extraPayload,
				mediaSourceInfo: playbackInfo.MediaSources?.[0]
					? JSON.stringify(playbackInfo.MediaSources[0])
					: '{}',
				sessionId: playbackInfo.PlaySessionId ?? '',
			},
		}
	})

	return updatedTracks
}
