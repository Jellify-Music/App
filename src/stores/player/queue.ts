import { Queue } from '@/src/player/types/queue-item'
import JellifyTrack from '@/src/types/JellifyTrack'
import { mmkvStateStorage } from '../../constants/storage'
import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import { RepeatMode } from 'react-native-track-player'

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
				storage: createJSONStorage(() => mmkvStateStorage),
			},
		),
	),
)

export const usePlayQueue = () => usePlayerQueueStore((state) => state.queue)

export const useShuffle = () => usePlayerQueueStore((state) => state.shuffled)

export const useQueueRef = () => usePlayerQueueStore((state) => state.queueRef)

export const useCurrentTrack = () => usePlayerQueueStore((state) => state.currentTrack)

export const useCurrentIndex = () => usePlayerQueueStore((state) => state.currentIndex)

export const useRepeatModeStoreValue = () => usePlayerQueueStore((state) => state.repeatMode)
