import { isUndefined } from 'lodash'
import { getActiveIndex, getCurrentTrack, getPlayQueue } from '.'
import TrackPlayer, { RepeatMode } from 'react-native-track-player'
import { usePlayerQueueStore } from '../../../stores/player/queue'
import { queryClient } from '../../../constants/query-client'
import { REPEAT_MODE_QUERY_KEY } from '../constants/query-keys'
import { createMMKV } from 'react-native-mmkv'

export default async function Initialize() {
	const {
		queue: persistedQueue,
		currentIndex: persistedIndex,
		currentTrack: persistedTrack,
		repeatMode,
	} = usePlayerQueueStore.getState()

	// Read saved position BEFORE reset() to prevent it from being cleared
	const progressStorage = createMMKV({ id: 'progress_storage' })
	const savedPosition = progressStorage.getNumber('player-key') ?? 0
	console.log('savedPosition before reset', savedPosition)

	const storedPlayQueue = persistedQueue.length > 0 ? persistedQueue : getPlayQueue()
	const storedIndex = persistedIndex ?? getActiveIndex()
	const storedTrack = persistedTrack ?? getCurrentTrack()

	if (
		Array.isArray(storedPlayQueue) &&
		storedPlayQueue.length > 0 &&
		!isUndefined(storedIndex) &&
		storedIndex !== null
	) {
		await TrackPlayer.reset()
		await TrackPlayer.add(storedPlayQueue)
		await TrackPlayer.skip(storedIndex)

		usePlayerQueueStore.getState().setQueue(storedPlayQueue)
		usePlayerQueueStore.getState().setCurrentIndex(storedIndex)
		usePlayerQueueStore.getState().setCurrentTrack(storedPlayQueue[storedIndex] ?? undefined)
	}

	const restoredRepeatMode = repeatMode ?? RepeatMode.Off
	await TrackPlayer.setRepeatMode(restoredRepeatMode)
	queryClient.setQueryData(REPEAT_MODE_QUERY_KEY, restoredRepeatMode)

	// Restore saved playback position after queue is loaded
	if (savedPosition > 0) {
		try {
			await TrackPlayer.seekTo(savedPosition)
			console.log('Restored playback position:', savedPosition)
		} catch (error) {
			console.warn('Failed to restore playback position:', error)
		}
	}
}
