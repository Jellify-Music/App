import { updateQueueTracks } from '../../../stores/player/queue'
import resolveTrackUrls from '../../../utils/fetching/track-media-info'
import { TrackItem, TrackPlayer } from 'react-native-nitro-player'
import Toast from 'react-native-toast-message'

/**
 * Core URL-resolution logic. Fetches fresh playback info for each track,
 * builds updated track objects, calls TrackPlayer.updateTracks and syncs
 * the JS queue store. Has no guards — callers are responsible for gating.
 */
export async function updateTrackMediaInfo(
	tracks: TrackItem[],
	signal?: AbortSignal,
): Promise<void> {
	const updatedTracks = await resolveTrackUrls(tracks, 'stream', signal)

	if (signal?.aborted) return

	await TrackPlayer.updateTracks(updatedTracks)

	updateQueueTracks(updatedTracks)

	const unresolvedIds = new Set(updatedTracks.filter((track) => !track.url).map((t) => t.id))

	if (unresolvedIds.size > 0) await stopIfCurrentTrackUnresolved(unresolvedIds)
}

/**
 * The player waits indefinitely on a current track without a URL, so if
 * resolving it failed (e.g. the network dropped), stop buffering and let
 * the user retry instead of spinning forever.
 */
async function stopIfCurrentTrackUnresolved(unresolvedIds: Set<string>): Promise<void> {
	const { currentTrack, currentState } = await TrackPlayer.getState()

	if (!currentTrack || currentTrack.url || !unresolvedIds.has(currentTrack.id)) return

	// A paused player (e.g. a queue restored on launch) isn't waiting on anything
	if (currentState !== 'buffering') return

	await TrackPlayer.pause()

	Toast.show({
		type: 'error',
		text1: `Unable to load ${currentTrack.title}`,
		text2: 'Check your connection and try again',
	})
}
