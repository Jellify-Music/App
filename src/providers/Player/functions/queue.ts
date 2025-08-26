import { mapDtoToTrack } from '../../../utils/mappings'
import { networkStatusTypes } from '../../../components/Network/internetConnectionWatcher'
import { filterTracksOnNetworkStatus } from '../utils/queue'
import { AddToQueueMutation, QueueMutation } from '../interfaces'
import { QueuingType } from '../../../enums/queuing-type'
import { shuffleJellifyTracks } from '../utils/shuffle'
import TrackPlayer from 'react-native-track-player'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import Toast from 'react-native-toast-message'
import { findPlayQueueIndexStart } from '../utils'
import JellifyTrack from '@/src/types/JellifyTrack'
import { setPlayQueue, setQueueRef, setShuffled, setUnshuffledQueue } from '.'

export async function loadQueue({
	index,
	track,
	tracklist,
	queue: queueRef,
	shuffled = false,
	api,
	downloadQuality,
	deviceProfile,
	networkStatus = networkStatusTypes.ONLINE,
	downloadedTracks,
}: QueueMutation) {
	setQueueRef(queueRef)
	setShuffled(shuffled)

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
			QueuingType.FromSelection,
			downloadQuality,
			deviceProfile,
		),
	)

	// If shuffled is requested, shuffle the queue but keep the starting track first
	if (shuffled && queue.length > 1) {
		console.debug('Shuffling queue...')

		// Store the original unshuffled queue
		setUnshuffledQueue([...queue])

		// Find the starting track in the converted queue
		const startingJellifyTrack = queue.find((track) => track.item.Id === startingTrack.Id)

		if (startingJellifyTrack) {
			// Remove the starting track from the queue temporarily
			const tracksToShuffle = queue.filter((track) => track.item.Id !== startingTrack.Id)

			// Shuffle the remaining tracks
			const { shuffled: shuffledTracks } = shuffleJellifyTracks(tracksToShuffle)

			// Put the starting track first, followed by shuffled tracks
			queue = [startingJellifyTrack, ...shuffledTracks]

			console.debug(`Shuffled ${shuffledTracks.length} tracks, keeping starting track first`)
		} else {
			// Fallback: shuffle the entire queue
			const { shuffled: shuffledTracks } = shuffleJellifyTracks(queue)
			queue = shuffledTracks
			console.debug(`Shuffled entire queue as fallback`)
		}
	}

	// The start index for the shuffled queue is always 0 (starting track is first)
	const finalStartIndex = shuffled
		? 0
		: availableAudioItems.findIndex((item) => item.Id === startingTrack.Id)

	console.debug(
		`Filtered out ${
			tracklist.length - availableAudioItems.length
		} due to network status being ${networkStatus}`,
	)

	console.debug(`Final start index is ${finalStartIndex}`)

	await TrackPlayer.setQueue(queue)

	setPlayQueue(queue)

	console.debug(
		`Queued ${queue.length} tracks, starting at ${finalStartIndex}${shuffled ? ' (shuffled)' : ''}`,
	)

	return finalStartIndex
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
	downloadQuality,
	deviceProfile,
	tracks,
}: AddToQueueMutation) => {
	console.debug(`Playing item next in queue`)

	const tracksToPlayNext = tracks.map((item) =>
		mapDtoToTrack(
			api!,
			item,
			downloadedTracks ?? [],
			QueuingType.PlayingNext,
			downloadQuality,
			deviceProfile,
		),
	)

	const currentIndex = await TrackPlayer.getActiveTrackIndex()

	// Then update RNTP
	await TrackPlayer.add(tracksToPlayNext, currentIndex ?? 0 + 1)

	// Add to the state unshuffled queue, using the currently playing track as the index
	//    setUnshuffledQueue([
	//        ...unshuffledQueue.slice(0, unshuffledQueue.indexOf(nowPlaying) + 1),
	//        ...tracksToPlayNext,
	//        ...unshuffledQueue.slice(unshuffledQueue.indexOf(nowPlaying) + 1),
	//    ])

	// Show a toast
	Toast.show({
		text1: 'Playing next',
		type: 'success',
	})
}

export const playInQueue = async ({
	api,
	downloadQuality,
	deviceProfile,
	downloadedTracks,
	tracks,
}: AddToQueueMutation) => {
	const playQueue = await TrackPlayer.getQueue()

	const currentIndex = await TrackPlayer.getActiveTrackIndex()

	const insertIndex = await findPlayQueueIndexStart(
		playQueue as JellifyTrack[],
		currentIndex ?? 0,
	)
	console.debug(`Adding ${tracks.length} to queue at index ${insertIndex}`)

	const newTracks = tracks.map((item) =>
		mapDtoToTrack(
			api!,
			item,
			downloadedTracks ?? [],
			QueuingType.DirectlyQueued,
			downloadQuality,
			deviceProfile,
		),
	)

	// Then update RNTP
	await TrackPlayer.add(newTracks, insertIndex)

	// Update unshuffled queue with the same mapped tracks to avoid duplication
	//    setUnshuffledQueue([...unshuffledQueue, ...newTracks])
}
