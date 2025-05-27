import { JellifyTrack } from '../../types/JellifyTrack'
import TrackPlayer, { Track } from 'react-native-track-player'
import {
	PREFETCH_TRACK_COUNT,
	MAX_QUEUE_LOOKAHEAD,
	QUEUE_PREPARATION_THRESHOLD_SECONDS,
} from '../gapless-config'

/**
 * Enhanced gapless playback helper functions
 */

/**
 * Gets tracks that should be prefetched based on current position in queue
 * @param playQueue The current play queue
 * @param currentIndex Current track index
 * @param prefetchedIds Set of already prefetched track IDs
 * @returns Array of tracks to prefetch
 */
export function getTracksToPreload(
	playQueue: JellifyTrack[],
	currentIndex: number,
	prefetchedIds: Set<string>,
): JellifyTrack[] {
	const tracksToPreload: JellifyTrack[] = []

	// Get next N tracks for prefetching
	for (let i = 1; i <= PREFETCH_TRACK_COUNT; i++) {
		const nextIndex = currentIndex + i
		if (nextIndex < playQueue.length) {
			const track = playQueue[nextIndex]
			if (!prefetchedIds.has(track.item.Id!)) {
				tracksToPreload.push(track)
			}
		}
	}

	return tracksToPreload
}

/**
 * Gets tracks that should be added to the TrackPlayer queue for immediate playback
 * @param playQueue The current play queue
 * @param currentIndex Current track index
 * @returns Array of tracks to add to TrackPlayer queue
 */
export async function getTracksToAddToPlayerQueue(
	playQueue: JellifyTrack[],
	currentIndex: number,
): Promise<JellifyTrack[]> {
	const currentPlayerQueue = await TrackPlayer.getQueue()
	const tracksToAdd: JellifyTrack[] = []

	// Add upcoming tracks to player queue up to MAX_QUEUE_LOOKAHEAD
	for (let i = 1; i <= MAX_QUEUE_LOOKAHEAD; i++) {
		const nextIndex = currentIndex + i
		if (nextIndex < playQueue.length) {
			const track = playQueue[nextIndex]

			// Check if track is already in player queue
			const isInPlayerQueue = currentPlayerQueue.some(
				(playerTrack: Track) => playerTrack.id === track.id,
			)

			if (!isInPlayerQueue) {
				tracksToAdd.push(track)
			}
		}
	}

	return tracksToAdd
}

/**
 * Calculates if we should start prefetching based on current progress
 * @param position Current playback position in seconds
 * @param duration Track duration in seconds
 * @param thresholdSeconds Threshold before end to start prefetching
 * @returns Whether to start prefetching
 */
export function shouldStartPrefetching(
	position: number,
	duration: number,
	thresholdSeconds: number = QUEUE_PREPARATION_THRESHOLD_SECONDS,
): boolean {
	if (!duration || duration <= 0) return false

	const remainingSeconds = duration - position
	return remainingSeconds <= thresholdSeconds && remainingSeconds > 0
}

/**
 * Manages the size of the TrackPlayer queue to prevent memory issues
 * Removes tracks that are too far behind current position
 * @param currentIndex Current track index in play queue
 */
export async function cleanupPlayerQueue(currentIndex: number): Promise<void> {
	try {
		const playerQueue = await TrackPlayer.getQueue()
		const activeIndex = await TrackPlayer.getActiveTrackIndex()

		if (activeIndex === null || activeIndex === undefined) return

		// Remove tracks that are more than 2 positions behind current track
		const indicesToRemove: number[] = []

		for (let i = 0; i < activeIndex - 2; i++) {
			if (i >= 0 && i < playerQueue.length) {
				indicesToRemove.push(i)
			}
		}

		if (indicesToRemove.length > 0) {
			console.debug(`Cleaning up ${indicesToRemove.length} old tracks from player queue`)
			await TrackPlayer.remove(indicesToRemove)
		}
	} catch (error) {
		console.warn('Error cleaning up player queue:', error)
	}
}

/**
 * Optimizes the player queue by ensuring upcoming tracks are loaded
 * while keeping the queue size manageable
 * @param playQueue The app's play queue
 * @param currentIndex Current track index
 */
export async function optimizePlayerQueue(
	playQueue: JellifyTrack[],
	currentIndex: number,
): Promise<void> {
	try {
		// Clean up old tracks
		await cleanupPlayerQueue(currentIndex)

		// Add upcoming tracks
		const tracksToAdd = await getTracksToAddToPlayerQueue(playQueue, currentIndex)

		if (tracksToAdd.length > 0) {
			console.debug(
				`Adding ${tracksToAdd.length} tracks to player queue for gapless playback`,
			)
			await TrackPlayer.add(tracksToAdd)
		}
	} catch (error) {
		console.warn('Error optimizing player queue:', error)
	}
}
