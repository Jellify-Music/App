import { Queue } from '@/src/player/types/queue-item'
import JellifyTrack, {
	PersistedJellifyTrack,
	toPersistedTrack,
	fromPersistedTrack,
} from '../../types/JellifyTrack'
import { createVersionedMmkvStorage } from '../../constants/versioned-storage'
import { create } from 'zustand'
import {
	createJSONStorage,
	devtools,
	persist,
	PersistStorage,
	StorageValue,
} from 'zustand/middleware'
import { RepeatMode } from 'react-native-track-player'
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

	unShuffledQueue: JellifyTrack[]
	setUnshuffledQueue: (unShuffledQueue: JellifyTrack[]) => void

	queue: JellifyTrack[]
	setQueue: (queue: JellifyTrack[]) => void

	currentTrack: JellifyTrack | undefined
	setCurrentTrack: (track: JellifyTrack | undefined) => void

	currentIndex: number | undefined
	setCurrentIndex: (index: number | undefined) => void
}

/**
 * Persisted state shape - uses slimmed track types to reduce storage size
 */
type PersistedPlayerQueueState = {
	shuffled: boolean
	repeatMode: RepeatMode
	queueRef: Queue
	unShuffledQueue: PersistedJellifyTrack[]
	queue: PersistedJellifyTrack[]
	currentTrack: PersistedJellifyTrack | undefined
	currentIndex: number | undefined
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
			const parsed = JSON.parse(str) as StorageValue<PersistedPlayerQueueState>
			const state = parsed.state

			// Hydrate persisted tracks back to full JellifyTrack format
			return {
				...parsed,
				state: {
					...state,
					queue: (state.queue ?? []).map(fromPersistedTrack),
					unShuffledQueue: (state.unShuffledQueue ?? []).map(fromPersistedTrack),
					currentTrack: state.currentTrack
						? fromPersistedTrack(state.currentTrack)
						: undefined,
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
		const persistedState: PersistedPlayerQueueState = {
			shuffled: state.shuffled,
			repeatMode: state.repeatMode,
			queueRef: state.queueRef,
			// Limit queue size to prevent storage overflow
			queue: (state.queue ?? []).slice(0, MAX_PERSISTED_QUEUE_SIZE).map(toPersistedTrack),
			unShuffledQueue: (state.unShuffledQueue ?? [])
				.slice(0, MAX_PERSISTED_QUEUE_SIZE)
				.map(toPersistedTrack),
			currentTrack: state.currentTrack ? toPersistedTrack(state.currentTrack) : undefined,
			currentIndex: state.currentIndex,
		}

		const toStore: StorageValue<PersistedPlayerQueueState> = {
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

				repeatMode: RepeatMode.Off,
				setRepeatMode: (repeatMode: RepeatMode) => set({ repeatMode }),

				queueRef: 'Recently Played',
				setQueueRef: (queueRef) =>
					set({
						queueRef,
					}),

				unShuffledQueue: [],
				setUnshuffledQueue: (unShuffledQueue: JellifyTrack[]) =>
					set({
						unShuffledQueue,
					}),

				queue: [],
				setQueue: (queue: JellifyTrack[]) =>
					set({
						queue,
					}),

				currentTrack: undefined,
				setCurrentTrack: (currentTrack: JellifyTrack | undefined) =>
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

export const useCurrentIndex = () => usePlayerQueueStore((state) => state.currentIndex)

export const useRepeatModeStoreValue = () => usePlayerQueueStore((state) => state.repeatMode)
