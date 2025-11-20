import { mapDtoToTrack } from '../../../utils/mappings'
import { networkStatusTypes } from '../../../components/Network/internetConnectionWatcher'
import { filterTracksOnNetworkStatus } from '../utils/queue'
import { AddToQueueMutation, QueueMutation } from '../interfaces'
import { QueuingType } from '../../../enums/queuing-type'
import { shuffleJellifyTracks } from '../utils/shuffle'
import TrackPlayer from 'react-native-track-player'
import JellifyTrack from '../../../types/JellifyTrack'
import { getCurrentTrack } from '.'
import { JellifyDownload } from '../../../types/JellifyDownload'
import { usePlayerQueueStore } from '../../../stores/player/queue'
import { getAudioCache } from '../../../api/mutations/download/offlineModeUtils'
import { isUndefined } from 'lodash'

type LoadQueueResult = {
	finalStartIndex: number
	tracks: JellifyTrack[]
}

export async function loadQueue({
	index,
	tracklist,
	queue: queueRef,
	shuffled = false,
	api,
	deviceProfile,
	networkStatus = networkStatusTypes.ONLINE,
}: QueueMutation): Promise<LoadQueueResult> {
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
	let queue = availableAudioItems.map((item) =>
		mapDtoToTrack(api!, item, deviceProfile!, QueuingType.FromSelection),
	)

	// Store the original unshuffled queue
	usePlayerQueueStore.getState().setUnshuffledQueue(queue)

	// Handle if a shuffle was requested
	if (shuffled && queue.length > 1) {
		console.debug('Shuffling queue...')

		const { shuffled: shuffledTracks } = shuffleJellifyTracks(queue)
		queue = shuffledTracks
		console.debug(`Shuffled entire queue as fallback`)
	}

	// The start index for the shuffled queue is always 0 (starting track is first)
	const finalStartIndex = availableAudioItems.findIndex((item) => item.Id === startingTrack.Id)

	console.debug(
		`Filtered out ${
			tracklist.length - availableAudioItems.length
		} due to network status being ${networkStatus}`,
	)

	console.debug(`Final start index is ${finalStartIndex}`)

	await TrackPlayer.stop()

	/**
	 *  Keep the requested track as the currently playing track so there
	 * isn't any flickering in the miniplayer
	 */
	await TrackPlayer.setQueue([queue[finalStartIndex]])
	await TrackPlayer.add([...queue.slice(0, finalStartIndex), ...queue.slice(finalStartIndex + 1)])
	await TrackPlayer.move(0, finalStartIndex)

	console.debug(
		`Queued ${queue.length} tracks, starting at ${finalStartIndex}${shuffled ? ' (shuffled)' : ''}`,
	)

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
export const playNextInQueue = async ({ api, deviceProfile, tracks }: AddToQueueMutation) => {
	const tracksToPlayNext = tracks.map((item) =>
		mapDtoToTrack(api!, item, deviceProfile!, QueuingType.PlayingNext),
	)

	const currentIndex = await TrackPlayer.getActiveTrackIndex()
	const currentQueue = (await TrackPlayer.getQueue()) as JellifyTrack[]

	console.debug(`Adding ${tracks.length} to the queue at index ${currentIndex}`)

	// If we're already at the end of the queue, add the track to the end
	if (currentIndex === currentQueue.length - 1) await TrackPlayer.add(tracksToPlayNext)
	// Else as long as we have an active index, we'll add the track(s) after that
	else if (!isUndefined(currentIndex)) await TrackPlayer.add(tracksToPlayNext, currentIndex + 1)

	// Get the active queue, put it in Zustand
	const updatedQueue = (await TrackPlayer.getQueue()) as JellifyTrack[]
	usePlayerQueueStore.getState().setQueue([...updatedQueue])

	// Add to the state unshuffled queue, using the currently playing track as the index
	usePlayerQueueStore
		.getState()
		.setUnshuffledQueue([
			...usePlayerQueueStore
				.getState()
				.unShuffledQueue.slice(
					0,
					usePlayerQueueStore.getState().unShuffledQueue.indexOf(getCurrentTrack()!) + 1,
				),
			...tracksToPlayNext,
			...usePlayerQueueStore
				.getState()
				.unShuffledQueue.slice(
					usePlayerQueueStore.getState().unShuffledQueue.indexOf(getCurrentTrack()!) + 1,
				),
		])
}

export const playLaterInQueue = async ({ api, deviceProfile, tracks }: AddToQueueMutation) => {
	console.debug(`Adding ${tracks.length} to queue`)

	const newTracks = tracks.map((item) =>
		mapDtoToTrack(api!, item, deviceProfile!, QueuingType.DirectlyQueued),
	)

	// Then update RNTP
	await TrackPlayer.add(newTracks)

	const updatedQueue = (await TrackPlayer.getQueue()) as JellifyTrack[]
	usePlayerQueueStore.getState().setQueue(updatedQueue)

	// Update unshuffled queue with the same mapped tracks to avoid duplication
	usePlayerQueueStore
		.getState()
		.setUnshuffledQueue([...usePlayerQueueStore.getState().unShuffledQueue, ...newTracks])
}
