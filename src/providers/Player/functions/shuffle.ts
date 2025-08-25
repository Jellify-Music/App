import JellifyTrack from '../../../types/JellifyTrack'
import { queryClient } from '../../../constants/query-client'
import {
	ACTIVE_INDEX_QUERY_KEY,
	NOW_PLAYING_QUERY_KEY,
	PLAY_QUEUE_QUERY_KEY,
} from '../constants/query-keys'
import Toast from 'react-native-toast-message'
import {
	getActiveIndex,
	getCurrentTrack,
	getPlayQueue,
	getShuffled,
	getUnshuffledQueue,
	setShuffled,
	setUnshuffledQueue,
} from '.'
import { shuffleJellifyTracks } from '../utils/shuffle'
import TrackPlayer from 'react-native-track-player'
import { ensureUpcomingTracksInQueue } from '@/src/player/helpers/gapless'
import { invalidateActiveIndex } from './queries'

export async function handleShuffle(): Promise<void> {
	const currentIndex = getActiveIndex()
	const currentTrack = getCurrentTrack()
	const playQueue = getPlayQueue()

	// Don't shuffle if queue is empty or has only one track
	if (playQueue && playQueue.length <= 1) {
		Toast.show({
			text1: 'Nothing to shuffle',
			type: 'info',
		})
		return Promise.resolve()
	}

	try {
		// Store the original queue for deshuffle
		setUnshuffledQueue(playQueue!)

		// Get the current track (if any)
		let newShuffledQueue: JellifyTrack[] = []

		// Approach 1: Only shuffle upcoming tracks (preserves listening history)
		const upcomingTracks = playQueue!.slice(currentIndex ?? 0 + 1)

		// If there are upcoming tracks to shuffle
		if (upcomingTracks.length > 0) {
			const { shuffled: shuffledUpcoming } = shuffleJellifyTracks(upcomingTracks)

			// Create new queue: played tracks + current + shuffled upcoming
			newShuffledQueue = [
				...playQueue!.slice(0, currentIndex ?? 0 + 1), // Keep played + current
				...shuffledUpcoming, // Shuffle only upcoming
			]

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
		await TrackPlayer.removeUpcomingTracks()
		await TrackPlayer.add(newShuffledQueue)

		// Prepare the next few tracks in TrackPlayer for smooth transitions
		try {
			await ensureUpcomingTracksInQueue(newShuffledQueue, currentIndex ?? 0)
		} catch (error) {
			console.warn('Failed to prepare upcoming tracks after shuffle:', error)
		}
	} catch (error) {
		console.error('Failed to shuffle queue:', error)
		Toast.show({
			text1: 'Failed to shuffle',
			type: 'error',
		})
	}
}

export async function handleDeshuffle() {
	const shuffled = getShuffled()
	const unshuffledQueue = getUnshuffledQueue()

	// Don't deshuffle if not shuffled or no unshuffled queue stored
	if (!shuffled || !unshuffledQueue || unshuffledQueue.length === 0) {
		Toast.show({
			text1: 'Nothing to deshuffle',
			type: 'info',
		})
		return
	}

	try {
		// Simply restore the original queue and clear shuffle state
		await TrackPlayer.setQueue(unshuffledQueue)
		setShuffled(false)

		const newCurrentIndex = await TrackPlayer.getActiveTrackIndex()

		// Just-in-time approach: Don't disrupt current playback
		// The queue will be updated when user skips or when tracks change
		console.debug(
			`Restored original app queue, ${unshuffledQueue.length} tracks. TrackPlayer queue will be updated as needed.`,
		)

		// Optionally, prepare the next few tracks in TrackPlayer for smooth transitions
		try {
			await ensureUpcomingTracksInQueue(unshuffledQueue, newCurrentIndex!)
		} catch (error) {
			console.warn('Failed to prepare upcoming tracks after deshuffle:', error)
		}

		Toast.show({
			text1: 'Deshuffled',
			type: 'success',
		})
	} catch (error) {
		console.error('Failed to deshuffle queue:', error)
		Toast.show({
			text1: 'Failed to deshuffle',
			type: 'error',
		})
	}
}
