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

	const insertIndex = calculatePlayNextInsertIndex(currentIndex, queue)

	const downloadedTracks = await ensureDownloadedTracks()

	const newTracks = mapDtosToTracks(tracks, downloadedTracks)

	const playlistId = await PlayerQueue.getCurrentPlaylistId()

	if (isNull(playlistId)) {
		console.warn('playNextInQueue: No active playlist to add to')
		return
	}

	await PlayerQueue.addTracksToPlaylist(playlistId, newTracks, insertIndex)

	const updatedQueue = await TrackPlayer.getActualQueue()

	usePlayerQueueStore.setState((state) => ({
		...state,
		queue: [...updatedQueue],
		unShuffledQueue: [...state.unShuffledQueue, ...newTracks],
	}))
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
