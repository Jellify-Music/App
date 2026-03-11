import { mapDtoToTrack } from '../../../utils/mapping/item-to-track'
import { networkStatusTypes } from '../../../components/Network/internetConnectionWatcher'
import { clearPlaylists, filterTracksOnNetworkStatus } from './utils/queue'
import { AddToQueueMutation, QueueMutation } from '../interfaces'
import { shuffleJellifyTracks } from './utils/shuffle'

import { setNewQueue, usePlayerQueueStore } from '../../../stores/player/queue'
import { isNull } from 'lodash'
import { useNetworkStore } from '../../../stores/network'
import { DownloadManager, PlayerQueue, TrackItem, TrackPlayer } from 'react-native-nitro-player'
import uuid from 'react-native-uuid'

type LoadQueueResult = {
	finalStartIndex: number
	tracks: TrackItem[]
}

export async function loadQueue({
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
	await TrackPlayer.skipToIndex(finalStartIndex)

	setNewQueue(playlist, queue, finalStartIndex, shuffled)

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
