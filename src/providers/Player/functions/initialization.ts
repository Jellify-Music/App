import { isUndefined } from 'lodash'
import { getActiveIndex, getCurrentTrack, getPlayQueue } from '.'
import TrackPlayer, { RepeatMode } from 'react-native-track-player'
import { usePlayerQueueStore } from '../../../stores/player/queue'
import { queryClient } from '../../../constants/query-client'
import { REPEAT_MODE_QUERY_KEY } from '../constants/query-keys'

export default async function Initialize() {
	const {
		queue: persistedQueue,
		currentIndex: persistedIndex,
		currentTrack: persistedTrack,
		repeatMode,
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
		usePlayerQueueStore.getState().setCurrentTrack(storedPlayQueue[storedIndex] ?? undefined)

		console.debug('Initialized play queue from storage')
	}

	const restoredRepeatMode = repeatMode ?? RepeatMode.Off
	await TrackPlayer.setRepeatMode(restoredRepeatMode)
	queryClient.setQueryData(REPEAT_MODE_QUERY_KEY, restoredRepeatMode)
}
