import { Queue } from '@/src/services/types/queue-item'
import { createVersionedMmkvStorage } from '../../constants/versioned-storage'
import { create } from 'zustand'
import { devtools, persist, PersistStorage, StorageValue } from 'zustand/middleware'
import { RepeatMode, TrackItem } from 'react-native-nitro-player'
import { useShallow } from 'zustand/react/shallow'

/**
 * Maximum number of tracks to persist in storage.
 * This prevents storage overflow when users have very large queues.
 */
const MAX_PERSISTED_QUEUE_SIZE = 500

type PlayerQueueStore = {
	isQueuing: boolean
	setIsQueuing: (isQueuing: boolean) => void

	shuffled: boolean
	setShuffled: (shuffled: boolean) => void

	repeatMode: RepeatMode
	setRepeatMode: (repeatMode: RepeatMode) => void

	queueRef: Queue | undefined
	setQueueRef: (queueRef: Queue | undefined) => void

	unShuffledQueue: TrackItem[]
	setUnshuffledQueue: (unShuffledQueue: TrackItem[]) => void

	queue: TrackItem[]
	setQueue: (queue: TrackItem[]) => void

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
				isQueuing: false,
				setIsQueuing: (isQueuing: boolean) => set({ isQueuing }),

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

export const useCurrentTrack = () =>
	usePlayerQueueStore((state) =>
		state.currentIndex !== undefined ? state.queue[state.currentIndex] : undefined,
	)

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

export const setNewQueue = (
	queue: TrackItem[],
	queueRef: Queue,
	index: number,
	shuffled: boolean,
) => {
	usePlayerQueueStore.setState({
		queue,
		queueRef,
		currentIndex: index,
		shuffled,
		isQueuing: false,
	})
}

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

export const setIsQueuing = (isQueuing: boolean) => {
	usePlayerQueueStore.getState().setIsQueuing(isQueuing)
}

export const updateQueueTracks = (updatedTracks: TrackItem[]) => {
	usePlayerQueueStore.setState((state) => ({
		...state,
		queue: state.queue.map((t) => {
			const updatedTrack = updatedTracks.find((ut) => ut.id === t.id)
			return updatedTrack ?? t
		}),
		unShuffledQueue: state.unShuffledQueue.map((t) => {
			const updatedTrack = updatedTracks.find((ut) => ut.id === t.id)
			return updatedTrack ?? t
		}),
	}))
}
