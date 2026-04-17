import { mapDtoToTrack } from '../../../utils/mapping/item-to-track'
import { networkStatusTypes } from '../../../components/Network/internetConnectionWatcher'
import { clearPlaylists, filterTracksOnNetworkStatus } from './utils/queue'
import { AddToQueueMutation, QueueMutation, QueueOrderMutation } from '../interfaces'
import { shuffleJellifyTracks } from './utils/shuffle'

import { setNewQueue, usePlayerQueueStore } from '../../../stores/player/queue'
import { isNull } from 'lodash'
import { useNetworkStore } from '../../../stores/network'
import { DownloadManager, PlayerQueue, TrackItem, TrackPlayer } from 'react-native-nitro-player'
import uuid from 'react-native-uuid'
import { triggerHaptic } from '../../use-haptic-feedback'
import Toast from 'react-native-toast-message'
import { QueuingType } from '../../../enums/queuing-type'
import resolveTrackUrls from '../../../utils/fetching/track-media-info'
import { Presets } from 'react-native-pulsar'

type LoadQueueResult = {
	finalStartIndex: number
	tracks: TrackItem[]
}

export const loadNewQueue = async (variables: QueueMutation) => {
	Presets.clasp()

	await loadQueue({ ...variables })

	if (variables.startPlayback) {
		TrackPlayer.play()
	}
}

async function loadQueue({
	index = 0,
	tracklist,
	queue,
	shuffled = false,
}: QueueMutation): Promise<LoadQueueResult> {
	await TrackPlayer.pause()

	usePlayerQueueStore.getState().setIsQueuing(true)

	const networkStatus = useNetworkStore.getState().networkStatus ?? networkStatusTypes.ONLINE

	// Get the item at the start index
	const startingTrack = tracklist[index]

	const downloadedTracks = await DownloadManager.getAllDownloadedTracks()
	const downloadedTrackIds = new Set(downloadedTracks?.map((d) => d.trackId) ?? [])

	const availableAudioItems = filterTracksOnNetworkStatus(
		networkStatus as networkStatusTypes,
		tracklist,
		downloadedTracks ?? [],
	)

	// Convert to JellifyTracks first
	let playlist = await Promise.all(availableAudioItems.map((item) => mapDtoToTrack(item)))

	// Store the original unshuffled queue
	usePlayerQueueStore.getState().setUnshuffledQueue(playlist)

	// Handle if a shuffle was requested
	if (shuffled && playlist.length > 1) {
		const startingTrackId = startingTrack.Id
		const mappedStartingTrack = playlist.find((track) => track.id === startingTrackId)

		if (mappedStartingTrack) {
			const remainingTracks = playlist.filter((track) => track.id !== startingTrackId)
			const { shuffled: shuffledTracks } = shuffleJellifyTracks(remainingTracks)
			playlist = [mappedStartingTrack, ...shuffledTracks]
		} else {
			const { shuffled: shuffledTracks } = shuffleJellifyTracks(playlist)
			playlist = shuffledTracks
		}
	}

	const finalStartIndex = playlist.findIndex((item) => item.id === startingTrack.Id) ?? 0

	/**
	 * Pro-actively resolve starting track if it's not downloaded
	 */
	const startTrack = playlist[finalStartIndex]
	if (startTrack && !downloadedTrackIds.has(startTrack.id)) {
		const [resolvedStartTrack] = await resolveTrackUrls([startTrack], 'stream')
		if (resolvedStartTrack) playlist[finalStartIndex] = resolvedStartTrack
	}

	await clearPlaylists()

	const playlistId = await PlayerQueue.createPlaylist(uuid.v4(), undefined, undefined)

	await PlayerQueue.addTracksToPlaylist(playlistId, playlist)
	await PlayerQueue.loadPlaylist(playlistId)

	setNewQueue(playlist, queue, finalStartIndex, shuffled)

	if (finalStartIndex !== 0) {
		await TrackPlayer.skipToIndex(finalStartIndex)
	}

	return {
		finalStartIndex,
		tracks: playlist,
	}
}

/**
 * Inserts a track at the next index in the queue
 *
 * Keeps a copy of the original queue in {@link unshuffledQueue}
 *
 * @param item The track to play next
 */
export const playNextInQueue = async ({ tracks }: AddToQueueMutation) => {
	const { currentIndex, queue } = usePlayerQueueStore.getState()

	/**
	 * Calculate the insert index for the new tracks.
	 *
	 * If there is a current track and the queue has at least one track after the current track, insert after the current track.
	 *
	 * If there is a current track at the end of the queue, insert at the end of the queue.
	 *
	 * If there is no current track, insert at the start of the queue.
	 */
	const insertIndex: number =
		currentIndex !== undefined
			? currentIndex < queue.length - 1
				? currentIndex + 1
				: queue.length
			: 0

	const newTracks = await Promise.all(tracks.map((item) => mapDtoToTrack(item)))

	const playlistId = await PlayerQueue.getCurrentPlaylistId()

	if (isNull(playlistId)) {
		console.warn('playNextInQueue: No active playlist to add to')
		return
	}

	// Add tracks to the same playlist context
	await PlayerQueue.addTracksToPlaylist(playlistId, newTracks, insertIndex)

	// Get the active queue and update Zustand while isQueuing=true blocks callbacks
	const updatedQueue = await TrackPlayer.getActualQueue()
	usePlayerQueueStore.setState((state) => ({
		...state,
		queue: [...updatedQueue],
		unShuffledQueue: [...state.unShuffledQueue, ...newTracks],
	}))
}

export const playLaterInQueue = async ({ tracks }: AddToQueueMutation) => {
	const newTracks = await Promise.all(tracks.map((item) => mapDtoToTrack(item)))

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

export const addToQueue = async (variables: AddToQueueMutation) => {
	try {
		usePlayerQueueStore.getState().setIsQueuing(true)

		const actualQueue = await TrackPlayer.getActualQueue()
		const actualQueueIds = actualQueue.map((t) => t.id)
		const tracksToAdd = variables.tracks.filter((item) => !actualQueueIds.includes(item.Id!))

		if (variables.queuingType === QueuingType.PlayNext)
			await playNextInQueue({ ...variables, tracks: tracksToAdd })
		else await playLaterInQueue({ ...variables, tracks: tracksToAdd })

		triggerHaptic('notificationSuccess')
		Toast.show({
			text1:
				variables.queuingType === QueuingType.PlayNext ? 'Playing next' : 'Added to queue',
			type: 'success',
		})
	} catch (error) {
		triggerHaptic('notificationError')
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
	} finally {
		usePlayerQueueStore.getState().setIsQueuing(false)
	}
}

export const removeItemFromQueue = async (index: number) => {
	triggerHaptic('impactMedium')

	const playlistId = PlayerQueue.getCurrentPlaylistId()

	if (!playlistId) return

	const playlist = PlayerQueue.getPlaylist(playlistId)!
	const trackIdToRemove = playlist.tracks[index].id

	// Remove from the native playlist first. If this is the currently-playing track,
	// the native rebuildQueueFromCurrentPosition will detect the mismatch and
	// automatically advance playback to the next track via playFromIndexInternal /
	// rebuildQueueFromPlaylistIndex — no explicit skipToNext() needed.
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

export const reorderQueue = async ({ fromIndex, toIndex }: QueueOrderMutation) => {
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
