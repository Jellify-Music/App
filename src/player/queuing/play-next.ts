import { ensureDownloadedTracks } from '../../hooks/downloads/utils'
import { usePlayerQueueStore } from '../../stores/player/queue'
import { mapDtosToTracks } from '../../utils/mapping/item-to-track'
import { isNull } from 'lodash'
import { PlayerQueue, TrackItem, TrackPlayer } from 'react-native-nitro-player'
import { AddToQueueMutation } from '../interfaces'

/**
 * Inserts a track at the next index in the queue
 *
 * Keeps a copy of the original queue in {@link unshuffledQueue}
 *
 * @param item The track to play next
 */
const playNextInQueue = async ({ tracks }: AddToQueueMutation) => {
	const { currentIndex, queue } = usePlayerQueueStore.getState()

	const queuedIds = queue.map((track) => track.id)

	const insertIndex = calculatePlayNextInsertIndex(currentIndex, queue)

	const downloadedTracks = await ensureDownloadedTracks()

	const newTracks = mapDtosToTracks(tracks, downloadedTracks)

	const playlistId = await PlayerQueue.getCurrentPlaylistId()

	if (isNull(playlistId)) {
		console.warn('playNextInQueue: No active playlist to add to')
		return
	}

	let updatedIndex = currentIndex
	const tracksToReorder: TrackItem[] = []
	const tracksToAdd: TrackItem[] = []

	newTracks.forEach((track) => {
		if (queuedIds.includes(track.id)) {
			tracksToReorder.push(track)
		} else {
			tracksToAdd.push(track)
		}
	})

	// Reorder existing tracks to the next position
	if (tracksToReorder.length > 0) {
		await reorderPlayNextTracksInQueue(
			playlistId,
			currentIndex,
			insertIndex,
			queue,
			tracksToReorder,
		)

		// Update the current index if it's changed
		updatedIndex = await TrackPlayer.getCurrentTrackIndex()
	}

	// Add new tracks to the queue
	if (tracksToAdd.length > 0) {
		await PlayerQueue.addTracksToPlaylist(playlistId, tracksToAdd, insertIndex)
	}

	const updatedQueue = await TrackPlayer.getActualQueue()

	usePlayerQueueStore.setState((state) => ({
		...state,
		currentIndex: updatedIndex,
		queue: [...updatedQueue],
		unShuffledQueue: [...state.unShuffledQueue, ...newTracks],
	}))
}

async function reorderPlayNextTracksInQueue(
	playlistId: string,
	currentIndex: number | undefined,
	insertIndex: number,
	queue: TrackItem[],
	tracksToReorder: TrackItem[],
) {
	const indexMap = new Map(queue.map((track, index) => [track.id, index]))

	const tracksMovingPastCurrent = tracksToReorder.filter((track) => {
		const currentPos = indexMap.get(track.id) ?? 0
		return currentPos < (currentIndex ?? 0)
	}).length

	const reorderPromises = tracksToReorder.map((track, index) =>
		PlayerQueue.reorderTrackInPlaylist(
			playlistId,
			track.id,
			insertIndex + index - tracksMovingPastCurrent,
		),
	)

	await Promise.all(reorderPromises)

	return tracksMovingPastCurrent
}

/**
 * Calculates the insert index for the new tracks.
 *
 * If there is a current track and the queue has at least one track after the current track, insert after the current track.
 *
 * If there is a current track at the end of the queue, insert at the end of the queue.
 *
 * If there is no current track, insert at the start of the queue.
 */
function calculatePlayNextInsertIndex(currentIndex: number | undefined, queue: TrackItem[]) {
	let insertIndex = 0

	if (currentIndex === undefined) return insertIndex

	if (currentIndex < queue.length - 1) {
		insertIndex = currentIndex + 1
	} else {
		insertIndex = queue.length
	}

	return insertIndex
}

export default playNextInQueue
