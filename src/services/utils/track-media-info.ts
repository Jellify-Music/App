import { updateQueueTracks } from '../../stores/player/queue'
import resolveTrackUrls from '../../utils/fetching/track-media-info'
import { TrackItem, TrackPlayer } from 'react-native-nitro-player'

let trackMediaInfoAbortController: AbortController | undefined

/**
 * Core URL-resolution logic. Fetches fresh playback info for each track,
 * builds updated track objects, calls TrackPlayer.updateTracks and syncs
 * the JS queue store. Has no guards — callers are responsible for gating.
 */
export async function updateTrackMediaInfo(tracks: TrackItem[]): Promise<void> {
	if (trackMediaInfoAbortController) trackMediaInfoAbortController.abort()

	trackMediaInfoAbortController = new AbortController()

	try {
		const updatedTracks = await resolveTrackUrls(tracks, 'stream')
		await TrackPlayer.updateTracks(updatedTracks)
		updateQueueTracks(updatedTracks)
	} catch (error: unknown) {
		if (error instanceof Error && error.name === 'AbortError') {
			console.debug('Previous track media info update request aborted')
		} else {
			throw error
		}
	}
}
