import JellifyTrack from '../../../types/JellifyTrack'
import Toast from 'react-native-toast-message'
import {
	getActiveIndex,
	getCurrentTrack,
	getPlayQueue,
	getShuffled,
	getUnshuffledQueue,
	setActiveIndex,
	setShuffled,
	setUnshuffledQueue,
} from '.'
import { shuffleJellifyTracks } from '../utils/shuffle'
import TrackPlayer from 'react-native-track-player'

export async function handleShuffle(): Promise<JellifyTrack[]> {
	const currentIndex = getActiveIndex()
	const currentTrack = getCurrentTrack()
	const playQueue = getPlayQueue()

	// Don't shuffle if queue is empty or has only one track
	if (!playQueue || playQueue.length <= 1 || !currentIndex || !currentTrack) {
		Toast.show({
			text1: 'Nothing to shuffle',
			type: 'info',
		})
		return Promise.resolve([])
	}

	const unusedTracks = playQueue
		.filter((_, index) => currentIndex != index)
		.map((track, index) => {
			return { track, index }
		})

	// Store the original queue for deshuffle
	setUnshuffledQueue(playQueue!)

	await TrackPlayer.move(currentIndex, 0)

	await TrackPlayer.removeUpcomingTracks()
	try {
		// Get the current track (if any)
		let newShuffledQueue: JellifyTrack[] = []

		// If there are upcoming tracks to shuffle
		if (unusedTracks.length > 0) {
			const { shuffled: shuffledUpcoming } = shuffleJellifyTracks(
				unusedTracks.map(({ track }) => track),
			)

			// Create new queue: played tracks + current + shuffled upcoming
			newShuffledQueue = shuffledUpcoming
			console.debug(
				`Shuffled ${shuffledUpcoming.length} upcoming tracks. Current track and history preserved.`,
			)

			Toast.show({
				text1: 'Shuffled',
				text2: `${shuffledUpcoming.length} upcoming tracks`,
				type: 'success',
			})
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

				console.debug(
					`Shuffled entire queue with current track preserved at index ${currentIndex}.`,
				)

				Toast.show({
					text1: 'Shuffled',
					text2: 'Entire queue shuffled',
					type: 'success',
				})
			} else {
				// No current track, shuffle everything
				const { shuffled: shuffledAll } = shuffleJellifyTracks(playQueue!)

				newShuffledQueue = shuffledAll

				console.debug(`Shuffled entire queue.`)

				Toast.show({
					text1: 'Shuffled',
					text2: 'Entire queue',
					type: 'success',
				})
			}
		}

		// Update app state
		setShuffled(true)
		await TrackPlayer.add(newShuffledQueue)

		return [currentTrack, ...newShuffledQueue]

		// // Prepare the next few tracks in TrackPlayer for smooth transitions
		// try {
		// 	await ensureUpcomingTracksInQueue(newShuffledQueue, currentIndex ?? 0)
		// } catch (error) {
		// 	console.warn('Failed to prepare upcoming tracks after shuffle:', error)
		// }
	} catch (error) {
		console.error('Failed to shuffle queue:', error)
		Toast.show({
			text1: 'Failed to shuffle',
			type: 'error',
		})

		return Promise.reject()
	}
}

export async function handleDeshuffle() {
	const shuffled = getShuffled()
	const unshuffledQueue = getUnshuffledQueue()
	const currentTrack = getCurrentTrack()
	const currentIndex = getActiveIndex()
	const playQueue = getPlayQueue()

	// Don't deshuffle if not shuffled or no unshuffled queue stored
	if (!shuffled || !unshuffledQueue || unshuffledQueue.length === 0) {
		Toast.show({
			text1: 'Nothing to deshuffle',
			type: 'info',
		})
		return
	}

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
	console.debug(
		`Moving active playing track from previous index of ${currentIndex} to ${newCurrentIndex}`,
	)
	console.debug(`Queue length is ${playQueue?.length}`)
	await TrackPlayer.move(0, newCurrentIndex)

	setActiveIndex(newCurrentIndex)

	setShuffled(false)

	// Just-in-time approach: Don't disrupt current playback
	// The queue will be updated when user skips or when tracks change
	console.debug(
		`Restored original app queue, ${unshuffledQueue.length} tracks. TrackPlayer queue will be updated as needed.`,
	)

	// // Optionally, prepare the next few tracks in TrackPlayer for smooth transitions
	// try {
	// 	await ensureUpcomingTracksInQueue(unshuffledQueue, newCurrentIndex!)
	// } catch (error) {
	// 	console.warn('Failed to prepare upcoming tracks after deshuffle:', error)
	// }

	Toast.show({
		text1: 'Deshuffled',
		type: 'success',
	})
}
