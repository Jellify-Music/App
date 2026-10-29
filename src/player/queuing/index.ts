import { AddToQueueMutation, QueueMutation } from '../interfaces'
import { usePlayerQueueStore } from '../../stores/player/queue'
import { PlayerQueue, TrackPlayer } from 'react-native-nitro-player'
import Toast from 'react-native-toast-message'
import { QueuingType } from '../../enums/queuing-type'
import { applyHapticFeedback } from '../../utils/haptics'
import playNextInQueue from './play-next'
import playLaterInQueue from './play-later'
import loadQueue from './load'

export const loadNewQueue = async (variables: QueueMutation) => {
	applyHapticFeedback('info')

	await loadQueue({ ...variables })

	if (variables.startPlayback) {
		await TrackPlayer.play()
	}
}

export const addToQueue = async (variables: AddToQueueMutation) => {
	try {
		const actualQueue = await TrackPlayer.getActualQueue()
		const actualQueueIds = actualQueue.map((t) => t.id)

		if (variables.queuingType === QueuingType.PlayNext) {
			// For PlayNext, pass all tracks so we can reorder existing ones
			await playNextInQueue(variables)
		} else {
			// For PlayLater, only add new tracks
			const tracksToAdd = variables.tracks.filter(
				(item) => !actualQueueIds.includes(item.Id!),
			)
			await playLaterInQueue({ ...variables, tracks: tracksToAdd })
		}

		applyHapticFeedback('success')
		Toast.show({
			text1:
				variables.queuingType === QueuingType.PlayNext ? 'Playing next' : 'Added to queue',
			type: 'success',
		})
	} catch (error) {
		applyHapticFeedback('error')
		console.error(
			`Failed to ${variables.queuingType === QueuingType.PlayNext ? 'play next' : 'add to queue'}`,
			error,
		)
		Toast.show({
			text1:
				variables.queuingType === QueuingType.PlayNext
					? 'Failed to play next'
					: 'Failed to add to queue',
			type: 'error',
		})
	}
}

export const removeItemFromQueue = async (index: number) => {
	applyHapticFeedback('info')

	const playlistId = PlayerQueue.getCurrentPlaylistId()

	if (!playlistId) return

	const playlist = PlayerQueue.getPlaylist(playlistId)!
	const trackIdToRemove = playlist.tracks[index].id

	PlayerQueue.removeTrackFromPlaylist(playlistId, trackIdToRemove)

	const {
		queue: prevQueue,
		unShuffledQueue: prevUnshuffledQueue,
		currentIndex,
	} = usePlayerQueueStore.getState()

	const newQueue = prevQueue.filter((_, i) => i !== index)

	// Also remove from unShuffledQueue to prevent orphaned tracks
	const newUnshuffledQueue = prevUnshuffledQueue.filter((t) => t.id !== trackIdToRemove)

	// If queue is now empty, stop playback and tear down
	if (newQueue.length === 0) {
		TrackPlayer.pause()
		usePlayerQueueStore.setState((state) => ({
			...state,
			queue: newQueue,
			unShuffledQueue: newUnshuffledQueue,
		}))
		usePlayerQueueStore.getState().setCurrentIndex(undefined)
		PlayerQueue.deletePlaylist(playlistId)
		return
	}

	// If a track before the current one was removed, shift the index down so it
	// keeps pointing at the same still-playing track.
	const newCurrentIndex = index < (currentIndex ?? 0) ? (currentIndex ?? 0) - 1 : currentIndex

	usePlayerQueueStore.setState((state) => ({
		...state,
		queue: newQueue,
		unShuffledQueue: newUnshuffledQueue,
		currentIndex: newCurrentIndex,
	}))
}
