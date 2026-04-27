import ensureMediaInfoQuery from '../../api/queries/media/queries'
import { PlaybackInfoResponse } from '@jellyfin/sdk/lib/generated-client/models/playback-info-response'
import { DownloadedTrack, TrackItem } from 'react-native-nitro-player'
import buildAudioApiUrl, { buildTranscodedAudioApiUrl } from '../mapping/item-to-audio-api-url'
import getTrackDto, { getTrackMediaSourceInfo } from '../mapping/track-extra-payload'
import { convertRunTimeTicksToSeconds } from '../mapping/ticks-to-seconds'
import { SourceType } from '@/src/types/JellifyTrack'

export default async function resolveTrackUrls(
	trackItems: TrackItem[],
	source: SourceType,
	downloadedTracks: DownloadedTrack[],
): Promise<TrackItem[]> {
	const downloadedTrackById = new Map(downloadedTracks.map((d) => [d.trackId, d]))

	const playbackInfoEntries = await Promise.allSettled(
		trackItems.map(async (track) => {
			let playbackInfo: PlaybackInfoResponse

			const downloadedTrack = downloadedTrackById.get(track.id)

			if (source === 'stream' && downloadedTrack) {
				// If the source is stream and the track is already downloaded, we can skip the media info query and just return an object with the local file path
				playbackInfo = {
					MediaSources: [getTrackMediaSourceInfo(downloadedTrack.originalTrack)!],
				} as PlaybackInfoResponse
			} else {
				playbackInfo = await ensureMediaInfoQuery(track.id, source)
			}
			return [track.id, playbackInfo] as [string, PlaybackInfoResponse]
		}),
	)

	const playbackInfoById = new Map(
		playbackInfoEntries
			.filter(
				(entry): entry is PromiseFulfilledResult<[string, PlaybackInfoResponse]> =>
					entry.status === 'fulfilled',
			)
			.map((entry) => entry.value),
	)

	const updatedTracks = trackItems.map((track) => {
		const downloadedTrack = downloadedTrackById.get(track.id)

		if (source === 'stream' && downloadedTrack?.localPath) {
			const mediaSourceInfo = getTrackMediaSourceInfo(downloadedTrack.originalTrack)

			return {
				...track,
				url: downloadedTrack.localPath,
				duration: mediaSourceInfo?.RunTimeTicks
					? convertRunTimeTicksToSeconds(mediaSourceInfo.RunTimeTicks)
					: track.duration,
				extraPayload: {
					...track.extraPayload,
					mediaSourceInfo: mediaSourceInfo ? JSON.stringify(mediaSourceInfo) : '{}',
					sessionId: '',
				},
			}
		}

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
