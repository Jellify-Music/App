import JellifyTrack from '../../../types/JellifyTrack'
import Toast from 'react-native-toast-message'
import { shuffleJellifyTracks } from './utils/shuffle'
import { isUndefined } from 'lodash'
import { usePlayerQueueStore } from '../../../stores/player/queue'
import { PlayerQueue, TrackPlayer } from 'react-native-nitro-player'

export function handleShuffle(): JellifyTrack[] {
	const playlistId = PlayerQueue.getCurrentPlaylistId()

	const currentIndex = usePlayerQueueStore.getState().currentIndex
	const currentTrack = usePlayerQueueStore.getState().currentTrack
	const playQueue = usePlayerQueueStore.getState().queue

	// Don't shuffle if queue is empty or has only one track
	if (
		!playQueue ||
		playQueue.length <= 1 ||
		isUndefined(currentIndex) ||
		!currentTrack ||
		!playlistId
	) {
		Toast.show({
			text1: 'Nothing to shuffle',
			type: 'info',
		})
		return []
	}

	// Save off unshuffledQueue
	usePlayerQueueStore.getState().setUnshuffledQueue([...playQueue])

	// Reorder current track to the front
	PlayerQueue.reorderTrackInPlaylist(playlistId, currentTrack.id, 0)

	const unusedTracks = playQueue
		.filter((_, index) => currentIndex != index)
		.map((track, index) => {
			return { track, index }
		})

	// Remove the rest of the tracks from the playlist
	unusedTracks.forEach(({ track }) => {
		PlayerQueue.removeTrackFromPlaylist(playlistId, track.id)
	})

	// Get the current track (if any)
	let newShuffledQueue: JellifyTrack[] = []

	// If there are upcoming tracks to shuffle
	if (unusedTracks.length > 0) {
		const { shuffled: shuffledUpcoming } = shuffleJellifyTracks(
			unusedTracks.map(({ track }) => track),
		)

		// Create new queue: played tracks + current + shuffled upcoming
		newShuffledQueue = shuffledUpcoming
	} else {
		// Approach 2: If no upcoming tracks, shuffle entire queue but keep current track position
		// This handles the case where user is at the end of the queue
		if (currentTrack) {
			// Remove current track, shuffle the rest, then put current track back at its position
			const otherTracks = playQueue!.filter((_, index) => index !== currentIndex)
			const { shuffled: shuffledOthers } = shuffleJellifyTracks(otherTracks)

			// Create new queue with current track in the middle
			newShuffledQueue = [
				...shuffledOthers.slice(0, currentIndex),
				currentTrack,
				...shuffledOthers.slice(currentIndex),
			]
		} else {
			// No current track, shuffle everything
			const { shuffled: shuffledAll } = shuffleJellifyTracks(playQueue!)

			newShuffledQueue = shuffledAll
		}
	}

	PlayerQueue.addTracksToPlaylist(playlistId, newShuffledQueue, 1)

	return [currentTrack, ...newShuffledQueue]

	// // Prepare the next few tracks in TrackPlayer for smooth transitions
	// try {
	// 	await ensureUpcomingTracksInQueue(newShuffledQueue, currentIndex ?? 0)
	// } catch (error) {
	// 	console.warn('Failed to prepare upcoming tracks after shuffle:', error)
	// }
}

export function handleDeshuffle() {
	const playlistId = PlayerQueue.getCurrentPlaylistId()

	const shuffled = usePlayerQueueStore.getState().shuffled
	const unshuffledQueue = usePlayerQueueStore.getState().unShuffledQueue
	const currentIndex = usePlayerQueueStore.getState().currentIndex
	const currentTrack = usePlayerQueueStore.getState().currentTrack
	const playQueue = usePlayerQueueStore.getState().queue

	// Don't deshuffle if not shuffled or no unshuffled queue stored
	if (!shuffled || !unshuffledQueue || unshuffledQueue.length === 0 || !playlistId) return

	// Move currently playing track to beginning of queue to preserve playback
	PlayerQueue.reorderTrackInPlaylist(playlistId, currentTrack!.id, 0)

	// Find tracks that aren't currently playing, these will be used to repopulate the queue
	const missingQueueItems = unshuffledQueue.filter(
		(track) => track.item.Id !== currentTrack?.item.Id,
	)

	// Find where the currently playing track belonged in the original queue, it will be moved to that position later
	const newCurrentIndex = unshuffledQueue.findIndex(
		(track) => track.item.Id === currentTrack?.item.Id,
	)

	// Clear Upcoming tracks
	missingQueueItems.forEach(({ id }) => PlayerQueue.removeTrackFromPlaylist(playlistId, id))

	// Add the original queue to the end, without the currently playing track since that's still in the queue
	PlayerQueue.addTracksToPlaylist(playlistId, missingQueueItems, 1)

	// Move the currently playing track into position
	PlayerQueue.reorderTrackInPlaylist(playlistId, currentTrack!.id, newCurrentIndex)

	// Just-in-time approach: Don't disrupt current playback
	// The queue will be updated when user skips or when tracks change
	usePlayerQueueStore.getState().setUnshuffledQueue([])
}
