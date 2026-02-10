import { mapDtoToTrack } from '../../../utils/mapping/item-to-track'
import { networkStatusTypes } from '../../../components/Network/internetConnectionWatcher'
import { filterTracksOnNetworkStatus } from './utils/queue'
import { AddToQueueMutation, QueueMutation } from '../interfaces'
import { shuffleJellifyTracks } from './utils/shuffle'

import JellifyTrack from '../../../types/JellifyTrack'
import { usePlayerQueueStore } from '../../../stores/player/queue'
import { getAudioCache } from '../../../api/mutations/download/offlineModeUtils'
import { isNull } from 'lodash'
import { useStreamingDeviceProfileStore } from '../../../stores/device-profile'
import { useNetworkStore } from '../../../stores/network'
import { PlayerQueue, TrackItem, TrackPlayer } from 'react-native-nitro-player'

type LoadQueueResult = {
	finalStartIndex: number
	tracks: TrackItem[]
}

export function loadQueue({
	index,
	tracklist,
	queue: queueRef,
	shuffled = false,
	startPlayback,
}: QueueMutation): LoadQueueResult {
	TrackPlayer.pause()

	const deviceProfile = useStreamingDeviceProfileStore.getState().deviceProfile!
	const networkStatus = useNetworkStore.getState().networkStatus ?? networkStatusTypes.ONLINE

	usePlayerQueueStore.getState().setQueueRef(queueRef)
	usePlayerQueueStore.getState().setShuffled(shuffled)

	const startIndex = index ?? 0

	// Get the item at the start index
	const startingTrack = tracklist[startIndex]

	const downloadedTracks = getAudioCache()

	const availableAudioItems = filterTracksOnNetworkStatus(
		networkStatus as networkStatusTypes,
		tracklist,
		downloadedTracks ?? [],
	)

	// Convert to JellifyTracks first
	let queue = availableAudioItems.map((item) => mapDtoToTrack(item, deviceProfile))

	// Store the original unshuffled queue
	usePlayerQueueStore.getState().setUnshuffledQueue(queue)

	// Handle if a shuffle was requested
	if (shuffled && queue.length > 1) {
		const { shuffled: shuffledTracks } = shuffleJellifyTracks(queue)
		queue = shuffledTracks
	}

	// The start index for the shuffled queue is always 0 (starting track is first)
	const finalStartIndex = availableAudioItems.findIndex((item) => item.Id === startingTrack.Id)

	/**
	 *  Keep the requested track as the currently playing track so there
	 * isn't any flickering in the miniplayer
	 */

	const playlistId = PlayerQueue.createPlaylist(
		typeof queueRef === 'string' ? queueRef : (queueRef.Name ?? 'Untitled'),
		undefined,
		undefined,
	)

	console.debug(finalStartIndex)

	PlayerQueue.addTracksToPlaylist(playlistId, queue, finalStartIndex)
	PlayerQueue.loadPlaylist(playlistId)
	TrackPlayer.skipToIndex(finalStartIndex)

	usePlayerQueueStore.getState().setCurrentIndex(finalStartIndex)
	usePlayerQueueStore.getState().setQueueRef(queueRef)
	usePlayerQueueStore.getState().setQueue(queue)
	usePlayerQueueStore.getState().setCurrentTrack(queue[finalStartIndex])

	if (startPlayback) TrackPlayer.play()

	return {
		finalStartIndex,
		tracks: queue,
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
	const deviceProfile = useStreamingDeviceProfileStore.getState().deviceProfile

	const tracksToPlayNext = tracks.map((item) => mapDtoToTrack(item, deviceProfile))

	const playlistId = PlayerQueue.getCurrentPlaylistId()

	if (isNull(playlistId)) return

	const { currentIndex } = await TrackPlayer.getState()
	const currentQueue = PlayerQueue.getPlaylist(playlistId)!.tracks as TrackItem[]

	// If we're already at the end of the queue, add the track to the end
	PlayerQueue.addTracksToPlaylist(playlistId, tracksToPlayNext, currentIndex! + 1)

	tracksToPlayNext.forEach(({ id }) => TrackPlayer.playNext(id))

	// Get the active queue, put it in Zustand
	const updatedQueue = PlayerQueue.getPlaylist(playlistId)!.tracks as TrackItem[]
	usePlayerQueueStore.getState().setQueue([...updatedQueue])

	// Add to the state unshuffled queue, using the currently playing track as the index
	usePlayerQueueStore
		.getState()
		.setUnshuffledQueue([
			...usePlayerQueueStore
				.getState()
				.unShuffledQueue.slice(
					0,
					usePlayerQueueStore
						.getState()
						.unShuffledQueue.indexOf(currentQueue[currentIndex!]) + 1,
				),
			...tracksToPlayNext,
			...usePlayerQueueStore
				.getState()
				.unShuffledQueue.slice(
					usePlayerQueueStore
						.getState()
						.unShuffledQueue.indexOf(currentQueue[currentIndex!]) + 1,
				),
		])
}

export const playLaterInQueue = async ({ tracks }: AddToQueueMutation) => {
	const deviceProfile = useStreamingDeviceProfileStore.getState().deviceProfile!

	const newTracks = tracks.map((item) => mapDtoToTrack(item, deviceProfile))

	const playlistId = PlayerQueue.getCurrentPlaylistId()

	if (isNull(playlistId)) return

	// Add to the end of the queue
	await PlayerQueue.addTracksToPlaylist(playlistId, newTracks)

	const updatedQueue = PlayerQueue.getPlaylist(playlistId)!.tracks as JellifyTrack[]
	usePlayerQueueStore.getState().setQueue(updatedQueue)

	// Update unshuffled queue with the same mapped tracks to avoid duplication
	usePlayerQueueStore
		.getState()
		.setUnshuffledQueue([...usePlayerQueueStore.getState().unShuffledQueue, ...newTracks])
}
