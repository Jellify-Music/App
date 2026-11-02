import { Queue } from '@/src/services/types/queue-item'
import { PlayerQueueStore } from './types'
import { setQueue } from './utils/set'
import { replaceQueue } from './utils/replace'
import { createVersionedMmkvStorage } from '../../constants/versioned-storage'
import { create } from 'zustand'
import { devtools, persist, PersistStorage, StorageValue } from 'zustand/middleware'
import { RepeatMode, TrackItem } from 'react-native-nitro-player'
import { useShallow } from 'zustand/react/shallow'
import getTrackDto from '../../utils/mapping/track-extra-payload'

/**
 * Maximum number of tracks to persist in storage.
 * This prevents storage overflow when users have very large queues.
 */
const MAX_PERSISTED_QUEUE_SIZE = 500

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
				setQueue: setQueue(set),

				currentIndex: undefined,
				setCurrentIndex: (currentIndex: number | undefined) =>
					set({
						currentIndex,
					}),

				replaceQueue: replaceQueue(set),
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

export const useCurrentTrack = () =>
	usePlayerQueueStore((state) =>
		state.currentIndex !== undefined ? state.queue[state.currentIndex] : undefined,
	)

export const useCurrentTrackItemDto = () => {
	const track = usePlayerQueueStore((state) =>
		state.currentIndex !== undefined ? state.queue[state.currentIndex] : undefined,
	)

	return getTrackDto(track)
}

/**
 * Returns only the current track ID for efficient comparisons.
 * Use this in list items to avoid re-renders when other track properties change.
 */
export const useCurrentTrackId = () =>
	usePlayerQueueStore((state) =>
		state.currentIndex !== undefined ? state.queue[state.currentIndex]?.id : undefined,
	)

export const useCurrentIndex = () => usePlayerQueueStore((state) => state.currentIndex)

export const useRepeatMode = () => usePlayerQueueStore((state) => state.repeatMode)

/**
 * Clears the queue and resets the player repeat mode to 'off'. This is useful when the user logs out or switches accounts.
 */
export const clearQueueStore = () => {
	const {
		setShuffled,
		setQueueRef,
		setUnshuffledQueue,
		setQueue,
		setCurrentIndex,
		setRepeatMode,
	} = usePlayerQueueStore.getState()

	setShuffled(false)
	setQueueRef(undefined)
	setUnshuffledQueue([])
	setQueue([])
	setCurrentIndex(undefined)
	setRepeatMode('off')
}
