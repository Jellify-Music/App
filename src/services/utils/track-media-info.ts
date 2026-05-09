import { updateQueueTracks } from '../../stores/player/queue'
import resolveTrackUrls from '../../utils/fetching/track-media-info'
import { TrackItem, TrackPlayer } from 'react-native-nitro-player'

/**
 * Core URL-resolution logic. Fetches fresh playback info for each track,
 * builds updated track objects, calls TrackPlayer.updateTracks and syncs
 * the JS queue store. Has no guards — callers are responsible for gating.
 */
export async function updateTrackMediaInfo(tracks: TrackItem[]): Promise<TrackItem[]> {
	const updatedTracks = await resolveTrackUrls(tracks, 'stream')

	await TrackPlayer.updateTracks(updatedTracks)

	updateQueueTracks(updatedTracks)

	return updatedTracks
}
