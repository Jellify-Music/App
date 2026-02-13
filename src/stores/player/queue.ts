import { Queue } from '@/src/services/types/queue-item'
import { createVersionedMmkvStorage } from '../../constants/versioned-storage'
import { create } from 'zustand'
import { devtools, persist, PersistStorage, StorageValue } from 'zustand/middleware'
import { RepeatMode, TrackItem, useNowPlaying } from 'react-native-nitro-player'
import { useShallow } from 'zustand/react/shallow'

/**
 * Maximum number of tracks to persist in storage.
 * This prevents storage overflow when users have very large queues.
 */
const MAX_PERSISTED_QUEUE_SIZE = 500

type PlayerQueueStore = {
	shuffled: boolean
	setShuffled: (shuffled: boolean) => void

	repeatMode: RepeatMode
	setRepeatMode: (repeatMode: RepeatMode) => void

	queueRef: Queue
	setQueueRef: (queueRef: Queue) => void

	unShuffledQueue: TrackItem[]
	setUnshuffledQueue: (unShuffledQueue: TrackItem[]) => void

	queue: TrackItem[]
	setQueue: (queue: TrackItem[]) => void

	currentTrack: TrackItem | undefined
	setCurrentTrack: (track: TrackItem | undefined) => void

	currentIndex: number | undefined
	setCurrentIndex: (index: number | undefined) => void
}

/**
 * Custom storage that serializes/deserializes tracks to their slim form
 * This prevents the "RangeError: String length exceeds limit" error
 */
const queueStorage: PersistStorage<PlayerQueueStore> = {
	getItem: (name) => {
		const storage = createVersionedMmkvStorage('player-queue-storage')
		const str = storage.getItem(name) as string | null
		if (!str) return null

		try {
			const parsed = JSON.parse(str) as StorageValue<PlayerQueueStore>
			const state = parsed.state

			// Hydrate persisted tracks back to full JellifyTrack format
			return {
				...parsed,
				state: {
					...state,
					queue: state.queue ?? [],
					unShuffledQueue: state.unShuffledQueue ?? [],
					currentTrack: state.currentTrack,
				} as unknown as PlayerQueueStore,
			}
		} catch (e) {
			console.error('[Queue Storage] Failed to parse stored queue:', e)
			return null
		}
	},
	setItem: (name, value) => {
		const storage = createVersionedMmkvStorage('player-queue-storage')
		const state = value.state

		// Slim down tracks before persisting to prevent storage overflow
		const persistedState = {
			...state,
			// Limit queue size to prevent storage overflow
			queue: (state.queue ?? []).slice(0, MAX_PERSISTED_QUEUE_SIZE),
			unShuffledQueue: (state.unShuffledQueue ?? []).slice(0, MAX_PERSISTED_QUEUE_SIZE),
		}

		const toStore: StorageValue<PlayerQueueStore> = {
			...value,
			state: persistedState,
		}

		storage.setItem(name, JSON.stringify(toStore))
	},
	removeItem: (name) => {
		const storage = createVersionedMmkvStorage('player-queue-storage')
		storage.removeItem(name)
	},
}

export const usePlayerQueueStore = create<PlayerQueueStore>()(
	devtools(
		persist(
			(set) => ({
				shuffled: false,
				setShuffled: (shuffled: boolean) => set({ shuffled }),

				repeatMode: 'off',
				setRepeatMode: (repeatMode: RepeatMode) => set({ repeatMode }),

				queueRef: 'Recently Played',
				setQueueRef: (queueRef) =>
					set({
						queueRef,
					}),

				unShuffledQueue: [],
				setUnshuffledQueue: (unShuffledQueue: TrackItem[]) =>
					set({
						unShuffledQueue,
					}),

				queue: [],
				setQueue: (queue: TrackItem[]) =>
					set({
						queue,
					}),

				currentTrack: undefined,
				setCurrentTrack: (currentTrack: TrackItem | undefined) =>
					set({
						currentTrack,
					}),

				currentIndex: undefined,
				setCurrentIndex: (currentIndex: number | undefined) =>
					set({
						currentIndex,
					}),
			}),
			{
				name: 'player-queue-storage',
				storage: queueStorage,
			},
		),
	),
)

export const usePlayQueue = () => usePlayerQueueStore(useShallow((state) => state.queue))

export const useShuffle = () => usePlayerQueueStore((state) => state.shuffled)

export const useQueueRef = () => usePlayerQueueStore((state) => state.queueRef)

export const useCurrentTrack = () => usePlayerQueueStore((state) => state.currentTrack)

/**
 * Returns only the current track ID for efficient comparisons.
 * Use this in list items to avoid re-renders when other track properties change.
 */
export const useCurrentTrackId = () => {
	const playerState = useNowPlaying()
	return playerState.currentTrack?.id
}

export const useCurrentIndex = () => usePlayerQueueStore((state) => state.currentIndex)

export const useRepeatMode = () => usePlayerQueueStore((state) => state.repeatMode)

export const setNewQueue = (
	queue: TrackItem[],
	queueRef: Queue,
	index: number,
	shuffled: boolean,
) => {
	usePlayerQueueStore.getState().setCurrentIndex(index)
	usePlayerQueueStore.getState().setQueueRef(queueRef)
	usePlayerQueueStore.getState().setQueue(queue)
	usePlayerQueueStore.getState().setCurrentTrack(queue[index])
	usePlayerQueueStore.getState().setShuffled(shuffled)
}
