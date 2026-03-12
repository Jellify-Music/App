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
import { updateTrackMediaInfo } from '../../../providers/Player/utils/event-handlers'
import reportPlaybackStarted from '../../../api/mutations/playback/functions/playback-started'

type LoadQueueResult = {
	finalStartIndex: number
	tracks: TrackItem[]
}

export const loadNewQueue = async (variables: QueueMutation) => {
	triggerHaptic('impactLight')
	usePlayerQueueStore.getState().setIsQueuing(true)
	const { tracks, finalStartIndex } = await loadQueue({ ...variables })

	// skipToIndex is now settled. Drive a single, authoritative URL-resolution
	// pass while isQueuing=true so any concurrent native callbacks are still
	// silenced. resolveTrackUrls bypasses the isQueuing guard intentionally.
	const tracksNeedingUrls = await TrackPlayer.getTracksNeedingUrls()
	if (tracksNeedingUrls.length > 0) {
		await updateTrackMediaInfo(tracksNeedingUrls)
	}

	usePlayerQueueStore.getState().setIsQueuing(false)

	if (variables.startPlayback) {
		TrackPlayer.play()
		reportPlaybackStarted(tracks[finalStartIndex], 0)
	}
}

async function loadQueue({
	index = 0,
	tracklist,
	queue,
	shuffled = false,
}: QueueMutation): Promise<LoadQueueResult> {
	TrackPlayer.pause()

	const networkStatus = useNetworkStore.getState().networkStatus ?? networkStatusTypes.ONLINE

	// Get the item at the start index
	const startingTrack = tracklist[index]

	const downloadedTracks = DownloadManager.getAllDownloadedTracks()

	const availableAudioItems = filterTracksOnNetworkStatus(
		networkStatus as networkStatusTypes,
		tracklist,
		downloadedTracks ?? [],
	)

	// Convert to JellifyTracks first
	let playlist = availableAudioItems.map((item) => mapDtoToTrack(item))

	// Store the original unshuffled queue
	usePlayerQueueStore.getState().setUnshuffledQueue(playlist)

	// Handle if a shuffle was requested
	if (shuffled && playlist.length > 1) {
		const { shuffled: shuffledTracks } = shuffleJellifyTracks(playlist)
		playlist = shuffledTracks
	}

	// The start index for the shuffled queue is always 0 (starting track is first)
	const finalStartIndex = availableAudioItems.findIndex((item) => item.Id === startingTrack.Id)

	clearPlaylists()

	const playlistId = PlayerQueue.createPlaylist(uuid.v4(), undefined, undefined)

	PlayerQueue.addTracksToPlaylist(playlistId, playlist)
	PlayerQueue.loadPlaylist(playlistId)
	await TrackPlayer.skipToIndex(finalStartIndex === -1 ? 0 : finalStartIndex)

	setNewQueue(playlist, queue, finalStartIndex === -1 ? 0 : finalStartIndex, shuffled)

	return {
		finalStartIndex: finalStartIndex === -1 ? 0 : finalStartIndex,
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
	const tracksToPlayNext = tracks.map((item) => mapDtoToTrack(item))

	const playlistId = PlayerQueue.createPlaylist(uuid.v4(), undefined, undefined)

	PlayerQueue.addTracksToPlaylist(playlistId, tracksToPlayNext)

	// Insert in reverse so the album plays in forward order. playNextInternal prepends
	// each call (inserts at index 0 or 1), so calling last-track-first means track[0]
	// ends up at the front of the stack after all insertions.
	for (let i = tracksToPlayNext.length - 1; i >= 0; i--) {
		await TrackPlayer.playNext(tracksToPlayNext[i].id)
	}

	// Get the active queue, put it in Zustand
	const updatedQueue = await TrackPlayer.getActualQueue()
	usePlayerQueueStore.getState().setQueue([...updatedQueue])

	usePlayerQueueStore
		.getState()
		.setUnshuffledQueue([
			...usePlayerQueueStore.getState().unShuffledQueue,
			...tracksToPlayNext,
		])
}

export const playLaterInQueue = async ({ tracks }: AddToQueueMutation) => {
	const newTracks = tracks.map((item) => mapDtoToTrack(item))

	const playlistId = PlayerQueue.getCurrentPlaylistId()

	if (isNull(playlistId)) return

	// Add to the end of the queue
	await PlayerQueue.addTracksToPlaylist(playlistId, newTracks)

	const updatedQueue = PlayerQueue.getPlaylist(playlistId)!.tracks
	usePlayerQueueStore.getState().setQueue(updatedQueue)

	// Update unshuffled queue with the same mapped tracks to avoid duplication
	usePlayerQueueStore
		.getState()
		.setUnshuffledQueue([...usePlayerQueueStore.getState().unShuffledQueue, ...newTracks])
}

export const addToQueue = async (variables: AddToQueueMutation) => {
	try {
		if (variables.queuingType === QueuingType.PlayNext) await playNextInQueue({ ...variables })
		else await playLaterInQueue({ ...variables })

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
		const queue = await TrackPlayer.getActualQueue()

		usePlayerQueueStore.getState().setQueue(queue)
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

	const { tracks } = PlayerQueue.getPlaylist(playlistId)!

	PlayerQueue.reorderTrackInPlaylist(playlistId, tracks[fromIndex].id, toIndex)

	const { currentIndex } = await TrackPlayer.getState()

	const queue = await TrackPlayer.getActualQueue()

	usePlayerQueueStore.setState((state) => ({
		...state,
		queue,
		currentIndex,
	}))
}
