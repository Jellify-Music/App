import { Queue } from '@/src/player/types/queue-item'
import JellifyTrack from '@/src/types/JellifyTrack'
import { devtools, persist } from 'zustand/middleware'
import { create } from 'zustand/react'

type PlayerQueueStore = {
	nowPlaying: JellifyTrack | undefined
	setNowPlaying: (nowPlaying: JellifyTrack | undefined) => void

	playQueue: JellifyTrack[]
	setPlayQueue: (playQueue: JellifyTrack[]) => void

	shuffled: boolean
	setShuffled: (shuffled: boolean) => void

	queueRef: Queue
	setQueueRef: (queueRef: Queue) => void

	unShuffledQueue: JellifyTrack[]
	setUnshuffledQueue: (unShuffledQueue: JellifyTrack[]) => void
}

export const usePlayerQueueStore = create<PlayerQueueStore>()(
	devtools(
		persist(
			(set) => ({
				nowPlaying: undefined,
				setNowPlaying: (nowPlaying: JellifyTrack | undefined) =>
					set({
						nowPlaying,
					}),

				playQueue: [],
				setPlayQueue: (playQueue: JellifyTrack[]) => set({ playQueue }),

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
			}),
			{
				name: 'player-queue-storage',
			},
		),
	),
)

export const useShuffle = () => usePlayerQueueStore((state) => state.shuffled)

export const useQueueRef = () => usePlayerQueueStore((state) => state.queueRef)
