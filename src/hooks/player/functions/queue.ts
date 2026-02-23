import { mapDtoToTrack } from '../../../utils/mapping/item-to-track'
import { networkStatusTypes } from '../../../components/Network/internetConnectionWatcher'
import { filterTracksOnNetworkStatus } from './utils/queue'
import { AddToQueueMutation, QueueMutation } from '../interfaces'
import { shuffleJellifyTracks } from './utils/shuffle'

import { setNewQueue, usePlayerQueueStore } from '../../../stores/player/queue'
import { isNull } from 'lodash'
import { useStreamingDeviceProfileStore } from '../../../stores/device-profile'
import { useNetworkStore } from '../../../stores/network'
import { DownloadManager, PlayerQueue, TrackItem, TrackPlayer } from 'react-native-nitro-player'
import reportPlaybackStarted from '../../../api/mutations/playback/functions/playback-started'

type LoadQueueResult = {
	finalStartIndex: number
	tracks: TrackItem[]
}

export async function loadQueue({
	index = 0,
	tracklist,
	queue,
	shuffled = false,
	startPlayback,
}: QueueMutation): Promise<LoadQueueResult> {
	TrackPlayer.pause()

	const deviceProfile = useStreamingDeviceProfileStore.getState().deviceProfile
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
	let playlist = await Promise.all(
		availableAudioItems.map((item) => mapDtoToTrack(item, deviceProfile)),
	)

	// Store the original unshuffled queue
	usePlayerQueueStore.getState().setUnshuffledQueue(playlist)

	// Handle if a shuffle was requested
	if (shuffled && playlist.length > 1) {
		const { shuffled: shuffledTracks } = shuffleJellifyTracks(playlist)
		playlist = shuffledTracks
	}

	// The start index for the shuffled queue is always 0 (starting track is first)
	const finalStartIndex = availableAudioItems.findIndex((item) => item.Id === startingTrack.Id)

	/**
	 *  Keep the requested track as the currently playing track so there
	 * isn't any flickering in the miniplayer
	 */

	const playlistId = PlayerQueue.createPlaylist(
		typeof queue === 'string' ? queue : (queue.Name ?? 'Untitled'),
		undefined,
		undefined,
	)

	PlayerQueue.addTracksToPlaylist(playlistId, playlist)
	PlayerQueue.loadPlaylist(playlistId)
	TrackPlayer.skipToIndex(finalStartIndex)

	setNewQueue(playlist, queue, finalStartIndex, shuffled)

	if (startPlayback) {
		TrackPlayer.play()
		await reportPlaybackStarted(playlist[finalStartIndex], 0)
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
	const deviceProfile = useStreamingDeviceProfileStore.getState().deviceProfile

	const tracksToPlayNext = await Promise.all(
		tracks.map((item) => mapDtoToTrack(item, deviceProfile)),
	)

	const { currentIndex, currentPlaylistId } = await TrackPlayer.getState()

	if (currentPlaylistId) {
		const currentQueue = PlayerQueue.getPlaylist(currentPlaylistId!)!.tracks

		PlayerQueue.addTracksToPlaylist(currentPlaylistId, tracksToPlayNext)

		await Promise.all(tracksToPlayNext.map(({ id }) => TrackPlayer.addToUpNext(id)))

		// Get the active queue, put it in Zustand
		const updatedQueue = await TrackPlayer.getActualQueue()
		usePlayerQueueStore.getState().setQueue([...updatedQueue])

		// Add to the state unshuffled queue, using the currently playing track as the index
		// TODO: Check this
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
	// If there isn't a current playlist, create one with the track to play next and load it
	else {
		const currentPlaylistId = PlayerQueue.createPlaylist('Playlist')

		PlayerQueue.addTracksToPlaylist(currentPlaylistId, tracksToPlayNext)
		PlayerQueue.loadPlaylist(currentPlaylistId)
		await TrackPlayer.addToUpNext(tracksToPlayNext[0].id)

		const updatedQueue = await TrackPlayer.getActualQueue()
		usePlayerQueueStore.getState().setQueue([...updatedQueue])
		usePlayerQueueStore.getState().setUnshuffledQueue([...tracksToPlayNext])
	}
}

export const playLaterInQueue = async ({ tracks }: AddToQueueMutation) => {
	const deviceProfile = useStreamingDeviceProfileStore.getState().deviceProfile!

	const newTracks = await Promise.all(tracks.map((item) => mapDtoToTrack(item, deviceProfile)))

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
