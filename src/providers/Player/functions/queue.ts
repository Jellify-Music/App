import { mapDtoToTrack } from '../../../utils/mappings'
import { networkStatusTypes } from '../../../components/Network/internetConnectionWatcher'
import { filterTracksOnNetworkStatus } from '../utils/queue'
import { AddToQueueMutation, QueueMutation } from '../interfaces'
import { QueuingType } from '../../../enums/queuing-type'
import { shuffleJellifyTracks } from '../utils/shuffle'
import TrackPlayer from 'react-native-track-player'
import Toast from 'react-native-toast-message'
import { findPlayQueueIndexStart } from '../utils'
import JellifyTrack from '../../../types/JellifyTrack'
import { getActiveIndex, getCurrentTrack } from '.'
import { JellifyDownload } from '../../../types/JellifyDownload'
import { usePlayerQueueStore } from '../../../stores/player/queue'

type LoadQueueOperation = QueueMutation & {
	downloadedTracks: JellifyDownload[] | undefined
}

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
	downloadedTracks,
}: LoadQueueOperation): Promise<LoadQueueResult> {
	usePlayerQueueStore.getState().setQueueRef(queueRef)
	usePlayerQueueStore.getState().setShuffled(shuffled)

	const startIndex = index ?? 0

	// Get the item at the start index
	const startingTrack = tracklist[startIndex]

	const availableAudioItems = filterTracksOnNetworkStatus(
		networkStatus as networkStatusTypes,
		tracklist,
		downloadedTracks ?? [],
	)

	// Convert to JellifyTracks first
	let queue = availableAudioItems.map((item) =>
		mapDtoToTrack(
			api!,
			item,
			downloadedTracks ?? [],
			deviceProfile!,
			QueuingType.FromSelection,
		),
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

	await TrackPlayer.setQueue(queue)

	console.debug(
		`Queued ${queue.length} tracks, starting at ${finalStartIndex}${shuffled ? ' (shuffled)' : ''}`,
	)

	return {
		finalStartIndex,
		tracks: queue,
	}
}

type PlayNextOperation = AddToQueueMutation & {
	downloadedTracks: JellifyDownload[] | undefined
}
/**
 * Inserts a track at the next index in the queue
 *
 * Keeps a copy of the original queue in {@link unshuffledQueue}
 *
 * @param item The track to play next
 */
export const playNextInQueue = async ({
	api,
	downloadedTracks,
	deviceProfile,
	tracks,
}: PlayNextOperation) => {
	const tracksToPlayNext = tracks.map((item) =>
		mapDtoToTrack(api!, item, downloadedTracks ?? [], deviceProfile!, QueuingType.PlayingNext),
	)

	const currentIndex = await TrackPlayer.getActiveTrackIndex()

	console.debug(`Adding ${tracks.length} to the queue at index ${currentIndex}`)
	// Then update RNTP
	await TrackPlayer.add(tracksToPlayNext, (currentIndex ?? 0) + 1)

	const updatedQueue = (await TrackPlayer.getQueue()) as JellifyTrack[]
	usePlayerQueueStore.getState().setQueue(updatedQueue)

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

type QueueOperation = AddToQueueMutation & {
	downloadedTracks: JellifyDownload[] | undefined
}

export const playLaterInQueue = async ({
	api,
	deviceProfile,
	downloadedTracks,
	tracks,
}: QueueOperation) => {
	console.debug(`Adding ${tracks.length} to queue`)

	const newTracks = tracks.map((item) =>
		mapDtoToTrack(
			api!,
			item,
			downloadedTracks ?? [],
			deviceProfile!,
			QueuingType.DirectlyQueued,
		),
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
