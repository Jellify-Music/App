import { Queue } from '@/src/player/types/queue-item'
import JellifyTrack from '@/src/types/JellifyTrack'
import { stateStorage } from '../../constants/storage'
import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'

type PlayerQueueStore = {
	shuffled: boolean
	setShuffled: (shuffled: boolean) => void

	queueRef: Queue
	setQueueRef: (queueRef: Queue) => void

	unShuffledQueue: JellifyTrack[]
	setUnshuffledQueue: (unShuffledQueue: JellifyTrack[]) => void

	queue: JellifyTrack[]
	setQueue: (queue: JellifyTrack[]) => void

	currentTrack: JellifyTrack | null
	setCurrentTrack: (track: JellifyTrack | null) => void

	currentIndex: number | null
	setCurrentIndex: (index: number | null) => void
}

export const usePlayerQueueStore = create<PlayerQueueStore>()(
	devtools(
		persist(
			(set) => ({
				shuffled: false,
				setShuffled: (shuffled: boolean) => set({ shuffled }),

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

				currentTrack: null,
				setCurrentTrack: (currentTrack: JellifyTrack | null) =>
					set({
						currentTrack,
					}),

				currentIndex: null,
				setCurrentIndex: (currentIndex: number | null) =>
					set({
						currentIndex,
					}),
			}),
			{
				name: 'player-queue-storage',
				storage: createJSONStorage(() => stateStorage),
			},
		),
	),
)

export const useShuffle = () => usePlayerQueueStore((state) => state.shuffled)

export const useQueueRef = () => usePlayerQueueStore((state) => state.queueRef)

export const useCurrentTrack = () => usePlayerQueueStore((state) => state.currentTrack)

export const useCurrentIndex = () => usePlayerQueueStore((state) => state.currentIndex)
