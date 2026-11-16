import queryForMediaInfo from '../../api/queries/media/queries'
import { PlaybackInfoResponse } from '@jellyfin/sdk/lib/generated-client/models/playback-info-response'
import { TrackItem } from 'react-native-nitro-player'
import buildAudioApiUrl, { buildTranscodedAudioApiUrl } from '../mapping/item-to-audio-api-url'
import getTrackDto from '../mapping/track-extra-payload'
import { convertRunTimeTicksToSeconds } from '../mapping/ticks-to-seconds'
import { SourceType } from '@/src/types/JellifyTrack'

export default async function resolveTrackUrls(
	trackItems: TrackItem[],
	source: SourceType,
	signal?: AbortSignal,
): Promise<TrackItem[]> {
	const playbackInfoEntries = await Promise.allSettled(
		trackItems.map(async (track) => {
			const playbackInfo = await queryForMediaInfo(track.id, source, signal)
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
		const playbackInfo = playbackInfoById.get(track.id)

		if (!playbackInfo) {
			console.warn(`No playback info found for track ${track.id}`)
			return track
		}

		return {
			...track,
			url: buildStreamUrl(track, playbackInfo),
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

/**
 * Fetches the URLs a Cast receiver plays, using the Cast device profile so formats it can't
 * decode (ALAC) are transcoded.
 *
 * @returns The Cast URL for each track whose playback info was fetched, keyed by track id
 */
export async function resolveCastUrls(
	trackItems: TrackItem[],
	signal?: AbortSignal,
): Promise<Record<string, string>> {
	const castUrlEntries = await Promise.allSettled(
		trackItems.map(async (track) => {
			const playbackInfo = await queryForMediaInfo(track.id, 'cast', signal)
			return [track.id, buildStreamUrl(track, playbackInfo)] as [string, string]
		}),
	)

	return Object.fromEntries(
		castUrlEntries
			.filter(
				(entry): entry is PromiseFulfilledResult<[string, string]> =>
					entry.status === 'fulfilled',
			)
			.map((entry) => entry.value),
	)
}

const buildStreamUrl = (track: TrackItem, playbackInfo: PlaybackInfoResponse) =>
	playbackInfo.MediaSources?.[0]?.TranscodingUrl
		? buildTranscodedAudioApiUrl(playbackInfo)
		: buildAudioApiUrl(getTrackDto(track)!, playbackInfo)
