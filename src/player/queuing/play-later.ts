import { ensureDownloadedTracks } from '../../hooks/downloads/utils'
import { usePlayerQueueStore } from '../../stores/player/queue'
import { mapDtosToTracks } from '../../utils/mapping/item-to-track'
import { isNull } from 'lodash'
import { PlayerQueue, TrackPlayer } from 'react-native-nitro-player'
import { AddToQueueMutation } from '../interfaces'

const playLaterInQueue = async ({ tracks }: AddToQueueMutation) => {
	const downloadedTracks = await ensureDownloadedTracks()

	const newTracks = mapDtosToTracks(tracks, downloadedTracks)

	const playlistId = await PlayerQueue.getCurrentPlaylistId()

	if (isNull(playlistId)) {
		console.warn('playLaterInQueue: No active playlist to add to')
		return
	}

	// Add to the end of the queue
	await PlayerQueue.addTracksToPlaylist(playlistId, newTracks)

	// Get the active queue and update Zustand while isQueuing=true blocks callbacks
	const updatedQueue = await TrackPlayer.getActualQueue()

	usePlayerQueueStore.setState((state) => ({
		...state,
		queue: updatedQueue,
		unShuffledQueue: [...state.unShuffledQueue, ...newTracks],
	}))
}

export default playLaterInQueue
