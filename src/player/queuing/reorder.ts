import { usePlayerQueueStore } from '../../stores/player/queue'
import { PlayerQueue, TrackPlayer } from 'react-native-nitro-player'
import { QueueOrderMutation } from '../interfaces'

const reorderQueue = async ({ fromIndex, toIndex }: QueueOrderMutation) => {
	const playlistId = PlayerQueue.getCurrentPlaylistId()

	if (!playlistId) return

	const { queue: prevQueue, currentIndex: prevIndex } = usePlayerQueueStore.getState()
	const currentTrack = prevIndex !== undefined ? prevQueue[prevIndex] : undefined

	const { tracks } = PlayerQueue.getPlaylist(playlistId)!

	await PlayerQueue.reorderTrackInPlaylist(playlistId, tracks[fromIndex].id, toIndex)

	const queue = await TrackPlayer.getActualQueue()
	const updatedCurrentIndex = currentTrack
		? queue.findIndex((track) => track.id === currentTrack.id)
		: -1

	usePlayerQueueStore.setState((state) => ({
		...state,
		queue,
		currentIndex: updatedCurrentIndex !== -1 ? updatedCurrentIndex : prevIndex,
	}))
}

export default reorderQueue
