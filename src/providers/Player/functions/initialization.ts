import { isUndefined } from 'lodash'
import { getActiveIndex, getCurrentTrack, getPlayQueue } from '.'
import TrackPlayer from 'react-native-track-player'
import { usePlayerQueueStore } from '../../../stores/player/queue'

export default async function Initialize() {
	const {
		queue: persistedQueue,
		currentIndex: persistedIndex,
		currentTrack: persistedTrack,
	} = usePlayerQueueStore.getState()

	const storedPlayQueue = persistedQueue.length > 0 ? persistedQueue : getPlayQueue()
	const storedIndex = persistedIndex ?? getActiveIndex()
	const storedTrack = persistedTrack ?? getCurrentTrack()

	console.debug(
		`StoredIndex: ${storedIndex}, storedPlayQueue: ${storedPlayQueue?.map((track, index) => index)}, track: ${storedTrack?.item.Id}`,
	)

	if (
		Array.isArray(storedPlayQueue) &&
		storedPlayQueue.length > 0 &&
		!isUndefined(storedIndex) &&
		storedIndex !== null
	) {
		console.debug('Initializing play queue from storage')

		await TrackPlayer.reset()
		await TrackPlayer.add(storedPlayQueue)
		await TrackPlayer.skip(storedIndex)

		usePlayerQueueStore.getState().setQueue(storedPlayQueue)
		usePlayerQueueStore.getState().setCurrentIndex(storedIndex)
		usePlayerQueueStore.getState().setCurrentTrack(storedPlayQueue[storedIndex] ?? null)

		console.debug('Initialized play queue from storage')
	}
}
