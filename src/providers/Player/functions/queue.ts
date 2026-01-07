import { mapDtoToTrack } from '../../../utils/mapping/item-to-track'
import { networkStatusTypes } from '../../../components/Network/internetConnectionWatcher'
import { filterTracksOnNetworkStatus } from '../utils/queue'
import { AddToQueueMutation, QueueMutation } from '../interfaces'
import { QueuingType } from '../../../enums/queuing-type'
import { shuffleJellifyTracks } from '../utils/shuffle'
import TrackPlayer from 'react-native-track-player'
import JellifyTrack from '../../../types/JellifyTrack'
import { getCurrentTrack } from '.'
import { usePlayerQueueStore } from '../../../stores/player/queue'
import { getAudioCache } from '../../../api/mutations/download/offlineModeUtils'
import { isUndefined } from 'lodash'
import { useStreamingDeviceProfileStore } from '../../../stores/device-profile'
import { useNetworkStore } from '../../../stores/network'

type LoadQueueResult = {
	finalStartIndex: number
	tracks: JellifyTrack[]
}

export async function loadQueue({
	index,
	tracklist,
	queue: queueRef,
	shuffled = false,
	startPlayback,
}: QueueMutation): Promise<LoadQueueResult> {
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
	let queue = availableAudioItems.map((item) =>
		mapDtoToTrack(item, deviceProfile, QueuingType.FromSelection),
	)

	// Store the original unshuffled queue
	usePlayerQueueStore.getState().setUnshuffledQueue(queue)

	// Handle if a shuffle was requested
	if (shuffled && queue.length > 1) {
		const { shuffled: shuffledTracks } = shuffleJellifyTracks(queue)
		queue = shuffledTracks
	}

	// The start index for the shuffled queue is always 0 (starting track is first)
	const finalStartIndex = availableAudioItems.findIndex((item) => item.Id === startingTrack.Id)

	await TrackPlayer.stop()

	/**
	 *  Keep the requested track as the currently playing track so there
	 * isn't any flickering in the miniplayer
	 */
	await TrackPlayer.setQueue([queue[finalStartIndex]])
	await TrackPlayer.add([...queue.slice(0, finalStartIndex), ...queue.slice(finalStartIndex + 1)])
	await TrackPlayer.move(0, finalStartIndex)

	await TrackPlayer.skip(finalStartIndex)

	usePlayerQueueStore.getState().setCurrentIndex(finalStartIndex)
	usePlayerQueueStore.getState().setQueueRef(queueRef)
	usePlayerQueueStore.getState().setQueue(queue)
	usePlayerQueueStore.getState().setCurrentTrack(queue[finalStartIndex])

	if (startPlayback) await TrackPlayer.play()

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

	const tracksToPlayNext = tracks.map((item) =>
		mapDtoToTrack(item, deviceProfile, QueuingType.PlayingNext),
	)

	const currentIndex = await TrackPlayer.getActiveTrackIndex()
	const currentQueue = (await TrackPlayer.getQueue()) as JellifyTrack[]

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

export const playLaterInQueue = async ({ tracks }: AddToQueueMutation) => {
	const deviceProfile = useStreamingDeviceProfileStore.getState().deviceProfile!

	const newTracks = tracks.map((item) =>
		mapDtoToTrack(item, deviceProfile, QueuingType.DirectlyQueued),
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
