import { Progress, State } from 'react-native-track-player'
import JellifyTrack from '../../../types/JellifyTrack'
import { PlaystateApi } from '@jellyfin/sdk/lib/generated-client/api/playstate-api'
import { convertSecondsToRunTimeTicks } from '../../../utils/runtimeticks'
import { PROGRESS_UPDATE_EVENT_INTERVAL } from '../../../player/config'
import { getCurrentTrack } from '../functions'
import { queryClient } from '../../../constants/query-client'
import { QueryKeys } from '../../../enums/query-keys'
import { StreamingQuality } from '../../Settings'
import { PlaybackInfoResponse } from '@jellyfin/sdk/lib/generated-client/models'
import { JellifyDownload } from '../../../types/JellifyDownload'
import { networkStatusTypes } from '../../../components/Network/internetConnectionWatcher'
import {
	getTracksToPreload,
	optimizePlayerQueue,
	shouldStartPrefetching,
} from '../../../player/helpers/gapless'
import {
	PREFETCH_THRESHOLD_SECONDS,
	QUEUE_PREPARATION_THRESHOLD_SECONDS,
} from '../../../player/gapless-config'
import { saveAudio } from '../../../components/Network/offlineModeUtils'

export async function handlePlaybackState(
	playstateApi: PlaystateApi | undefined,
	streamingQuality: StreamingQuality,
	state: State,
) {
	const track = getCurrentTrack()

	if (playstateApi && track) {
		const mediaInfo = queryClient.getQueryData([
			QueryKeys.MediaSources,
			streamingQuality,
			track.item.Id,
		]) as PlaybackInfoResponse | undefined

		switch (state) {
			case State.Playing: {
				console.debug('Report playback started')
				await playstateApi.reportPlaybackStart({
					playbackStartInfo: {
						SessionId: mediaInfo?.PlaySessionId,
						ItemId: track.item.Id,
					},
				})
				break
			}

			case State.Ended:
			case State.Paused:
			case State.Stopped: {
				console.debug('Report playback stopped')
				await playstateApi.reportPlaybackStopped({
					playbackStopInfo: {
						SessionId: mediaInfo?.PlaySessionId,
						ItemId: track.item.Id,
					},
				})
				break
			}

			default: {
				return
			}
		}
	}
}

export async function handlePlaybackProgress(
	playstateApi: PlaystateApi | undefined,
	streamingQuality: StreamingQuality,
	duration: number,
	position: number,
) {
	const track = getCurrentTrack()

	const mediaInfo = queryClient.getQueryData([
		QueryKeys.MediaSources,
		streamingQuality,
		track?.item.Id,
	]) as PlaybackInfoResponse | undefined

	if (playstateApi && track) {
		console.debug('Playback progress updated')
		if (shouldMarkPlaybackFinished(duration, position)) {
			console.debug(`Track finished. ${playstateApi ? 'scrobbling...' : ''}`)

			await playstateApi.reportPlaybackStopped({
				playbackStopInfo: {
					SessionId: mediaInfo?.PlaySessionId,
					ItemId: track.item.Id,
					PositionTicks: convertSecondsToRunTimeTicks(track.duration!),
				},
			})
		} else {
			console.debug('Reporting playback position')
			await playstateApi.reportPlaybackProgress({
				playbackProgressInfo: {
					SessionId: mediaInfo?.PlaySessionId,
					ItemId: track.ItemId,
					PositionTicks: convertSecondsToRunTimeTicks(position),
				},
			})
		}
	}
}

export function shouldMarkPlaybackFinished(duration: number, position: number): boolean {
	return Math.floor(duration) - Math.floor(position) < PROGRESS_UPDATE_EVENT_INTERVAL
}

export async function cacheTrackIfConfigured(
	autoDownload: boolean,
	currentIndex: number | undefined,
	nowPlaying: JellifyTrack | undefined,
	playQueue: JellifyTrack[] | undefined,
	downloadedTracks: JellifyDownload[] | undefined,
	prefetchedTrackIds: Set<string>,
	networkStatus: networkStatusTypes | null,
	position: number,
	duration: number,
): Promise<void> {
	// Cache playing track at the first event emitted if it's not already downloaded
	if (
		nowPlaying &&
		Math.floor(position) === PROGRESS_UPDATE_EVENT_INTERVAL &&
		trackNotDownloaded(downloadedTracks, nowPlaying) &&
		// Only download if we are online or *optimistically* if the network status is unknown
		[networkStatusTypes.ONLINE, undefined, null].includes(networkStatus) &&
		// Only download if auto-download is enabled
		autoDownload
	)
		saveAudio(nowPlaying, () => {}, true)

	// --- ENHANCED GAPLESS PLAYBACK LOGIC ---
	if (nowPlaying && playQueue && typeof currentIndex === 'number' && autoDownload) {
		const positionFloor = Math.floor(position)
		const durationFloor = Math.floor(duration)
		const timeRemaining = duration - position

		// Check if we should start prefetching tracks
		if (shouldStartPrefetching(positionFloor, durationFloor, PREFETCH_THRESHOLD_SECONDS)) {
			const tracksToPreload = getTracksToPreload(playQueue, currentIndex, prefetchedTrackIds)

			if (tracksToPreload.length > 0) {
				console.debug(
					`Gapless: Found ${tracksToPreload.length} tracks to preload (${timeRemaining}s remaining)`,
				)

				// Filter tracks that aren't already downloaded
				const tracksToDownload = tracksToPreload.filter(
					(track) =>
						downloadedTracks?.filter((download) => download.item.Id === track.item.Id)
							.length === 0,
				)

				if (
					tracksToDownload.length > 0 &&
					[networkStatusTypes.ONLINE, undefined, null].includes(
						networkStatus as networkStatusTypes,
					)
				) {
					console.debug(`Gapless: Starting download of ${tracksToDownload.length} tracks`)
					tracksToDownload.forEach((track) => saveAudio(track, () => {}, true))
					// Mark tracks as prefetched
					tracksToDownload.forEach((track) => {
						if (track.item.Id) {
							prefetchedTrackIds.add(track.item.Id)
						}
					})
				}
			}
		}

		// Optimize the TrackPlayer queue for smooth transitions
		if (timeRemaining <= QUEUE_PREPARATION_THRESHOLD_SECONDS) {
			console.debug(`Gapless: Optimizing player queue (${timeRemaining}s remaining)`)
			optimizePlayerQueue(playQueue, currentIndex).catch((error) =>
				console.warn('Failed to optimize player queue:', error),
			)
		}
	}
}

function trackNotDownloaded(
	downloadedTracks: JellifyDownload[] | undefined,
	track: JellifyTrack,
): boolean {
	const notDownloaded =
		downloadedTracks?.filter((download) => download.item.Id === track?.item.Id).length === 0

	console.debug(`Currently playing track is currently ${notDownloaded && 'not'} downloaded`)

	return notDownloaded
}
