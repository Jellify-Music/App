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
import resolveTrackUrls from '../../../utils/fetching/track-media-info'

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
	const actualQueue = await TrackPlayer.getActualQueue()
	const actualQueueIds = actualQueue.map((t) => t.id)

	let playlistId = PlayerQueue.getCurrentPlaylistId()

	// If no active playlist exists, create a temporary one for play next operations
	if (isNull(playlistId)) {
		playlistId = PlayerQueue.createPlaylist(uuid.v4(), undefined, undefined)
	}

	const unresolvedTracksToPlayNext = tracks
		.filter((item) => !actualQueueIds.includes(item.Id!))
		.map((item) => mapDtoToTrack(item))
		.reverse() // reverse here so that when we insert in LIFO order, the original order is preserved

	const tracksToPlayNext = await resolveTrackUrls(unresolvedTracksToPlayNext, 'stream')

	// Add tracks to the same playlist context
	PlayerQueue.addTracksToPlaylist(playlistId, tracksToPlayNext)

	// Insert directly into the active queue by calling playNext for each track
	for (const track of tracksToPlayNext) {
		await TrackPlayer.playNext(track.id)
	}

	// Get the active queue and update Zustand while isQueuing=true blocks callbacks
	const updatedQueue = await TrackPlayer.getActualQueue()
	usePlayerQueueStore.setState((state) => ({
		...state,
		queue: [...updatedQueue],
		unShuffledQueue: [...state.unShuffledQueue, ...tracksToPlayNext],
	}))
}

export const playLaterInQueue = async ({ tracks }: AddToQueueMutation) => {
	const newTracks = tracks.map((item) => mapDtoToTrack(item))

	const playlistId = PlayerQueue.getCurrentPlaylistId()

	if (isNull(playlistId)) {
		console.warn('playLaterInQueue: No active playlist to add to')
		return
	}

	const actualQueue = await TrackPlayer.getActualQueue()
	const actualQueueIds = actualQueue.map((t) => t.id)

	// If any of the new tracks are already in the queue, we need to skip them.
	const newTracksFiltered = newTracks.filter((track) => !actualQueueIds.includes(track.id))

	// Add to the end of the queue
	await PlayerQueue.addTracksToPlaylist(playlistId, newTracksFiltered)

	// Get the active queue and update Zustand while isQueuing=true blocks callbacks
	const updatedQueue = await TrackPlayer.getActualQueue()

	usePlayerQueueStore.setState((state) => ({
		...state,
		queue: updatedQueue,
		unShuffledQueue: [...state.unShuffledQueue, ...newTracksFiltered],
	}))

	// CRITICAL: Resolve track URLs after adding so playback doesn't start before URLs are ready
	const tracksNeedingUrls = await TrackPlayer.getTracksNeedingUrls()
	if (tracksNeedingUrls.length > 0) {
		await updateTrackMediaInfo(tracksNeedingUrls)
	}
}

export const addToQueue = async (variables: AddToQueueMutation) => {
	try {
		usePlayerQueueStore.getState().setIsQueuing(true)
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
