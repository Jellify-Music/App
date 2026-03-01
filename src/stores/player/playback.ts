import { mmkvStateStorage } from '../../constants/storage'
import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'

type PlayerPlaybackStore = {
	position: number
	setPosition: (position: number) => void

	totalDuration: number
	setTotalDuration: (duration: number) => void
}

export const usePlayerPlaybackStore = create<PlayerPlaybackStore>()(
	devtools(
		persist(
			(set) => ({
				position: 0,
				setPosition: (position: number) => set({ position }),

				totalDuration: 0,
				setTotalDuration: (duration: number) => set({ totalDuration: duration }),
			}),
			{
				name: 'player-playback-storage',
				storage: createJSONStorage(() => mmkvStateStorage),
			},
		),
	),
)

export const usePlaybackPosition = () => usePlayerPlaybackStore((state) => state.position)

export const setPlaybackPosition = (position: number) => {
	usePlayerPlaybackStore.getState().setPosition(position)
}

export const useTotalDuration = () => usePlayerPlaybackStore((state) => state.totalDuration)

export const setTotalDuration = (duration: number) => {
	usePlayerPlaybackStore.getState().setTotalDuration(duration)
}
