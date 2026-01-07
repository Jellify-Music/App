import JellifyTrack from '../../../types/JellifyTrack'
import Toast from 'react-native-toast-message'
import { shuffleJellifyTracks } from './utils/shuffle'
import TrackPlayer from 'react-native-track-player'
import { cloneDeep, isUndefined } from 'lodash'
import { usePlayerQueueStore } from '../../../stores/player/queue'

export async function handleShuffle(): Promise<JellifyTrack[]> {
	const currentIndex = await TrackPlayer.getActiveTrackIndex()
	const currentTrack = (await TrackPlayer.getActiveTrack()) as JellifyTrack
	const playQueue = (await TrackPlayer.getQueue()) as JellifyTrack[]

	// Don't shuffle if queue is empty or has only one track
	if (!playQueue || playQueue.length <= 1 || isUndefined(currentIndex) || !currentTrack) {
		Toast.show({
			text1: 'Nothing to shuffle',
			type: 'info',
		})
		return Promise.resolve([])
	}

	// Save off unshuffledQueue
	usePlayerQueueStore.getState().setUnshuffledQueue([...playQueue])

	const unusedTracks = playQueue
		.filter((_, index) => currentIndex != index)
		.map((track, index) => {
			return { track, index }
		})

	await TrackPlayer.move(currentIndex, 0)

	await TrackPlayer.removeUpcomingTracks()
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

	await TrackPlayer.add(newShuffledQueue)

	return [currentTrack, ...newShuffledQueue]

	// // Prepare the next few tracks in TrackPlayer for smooth transitions
	// try {
	// 	await ensureUpcomingTracksInQueue(newShuffledQueue, currentIndex ?? 0)
	// } catch (error) {
	// 	console.warn('Failed to prepare upcoming tracks after shuffle:', error)
	// }
}

export async function handleDeshuffle() {
	const shuffled = usePlayerQueueStore.getState().shuffled
	const unshuffledQueue = usePlayerQueueStore.getState().unShuffledQueue
	const currentIndex = await TrackPlayer.getActiveTrackIndex()
	const currentTrack = (await TrackPlayer.getActiveTrack()) as JellifyTrack
	const playQueue = (await TrackPlayer.getQueue()) as JellifyTrack[]

	// Don't deshuffle if not shuffled or no unshuffled queue stored
	if (!shuffled || !unshuffledQueue || unshuffledQueue.length === 0) return

	// Move currently playing track to beginning of queue to preserve playback
	await TrackPlayer.move(currentIndex!, 0)

	// Find tracks that aren't currently playing, these will be used to repopulate the queue
	const missingQueueItems = unshuffledQueue.filter(
		(track) => track.item.Id !== currentTrack?.item.Id,
	)

	// Find where the currently playing track belonged in the original queue, it will be moved to that position later
	const newCurrentIndex = unshuffledQueue.findIndex(
		(track) => track.item.Id === currentTrack?.item.Id,
	)

	// Clear Upcoming tracks
	await TrackPlayer.removeUpcomingTracks()

	// Add the original queue to the end, without the currently playing track since that's still in the queue
	await TrackPlayer.add(missingQueueItems)

	// Move the currently playing track into position
	await TrackPlayer.move(0, newCurrentIndex)

	// Just-in-time approach: Don't disrupt current playback
	// The queue will be updated when user skips or when tracks change
	usePlayerQueueStore.getState().setUnshuffledQueue([])
}
