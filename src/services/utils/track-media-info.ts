import { captureInfo, LoggingContext } from '../../utils/logging'
import { updateQueueTracks } from '../../stores/player/queue'
import resolveTrackUrls from '../../utils/fetching/track-media-info'
import { TrackItem, TrackPlayer } from 'react-native-nitro-player'

let abortController: AbortController | null = null

/**
 * Core URL-resolution logic. Fetches fresh playback info for each track,
 * builds updated track objects, calls TrackPlayer.updateTracks and syncs
 * the JS queue store. Has no guards — callers are responsible for gating.
 */
export async function updateTrackMediaInfo(tracks: TrackItem[]): Promise<TrackItem[]> {
	// Abort any in-flight media info updates, since they're now stale
	abortController?.abort()
	abortController = new AbortController()
	const { signal } = abortController

	const updatedTracks = await resolveTrackUrls(tracks, 'stream', signal)

	// If the update was aborted, return early
	if (signal.aborted) {
		captureInfo(LoggingContext.MediaInfo, 'Media info update aborted, returning early')
		return []
	}

	await TrackPlayer.updateTracks(updatedTracks)

	updateQueueTracks(updatedTracks)

	return updatedTracks
}
