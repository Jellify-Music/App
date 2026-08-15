import { throttle } from 'lodash'
import { mmkvStateStorage } from '../../constants/storage'
import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import { POSITION_PERSISTENCE_INTERVAL } from '../../configs/player/reporting.config'

type PlayerPlaybackStore = {
	position: number
	setPosition: (position: number) => void
}

const setPositionItem = throttle(mmkvStateStorage.setItem, POSITION_PERSISTENCE_INTERVAL, {
	leading: true,
})

export const usePlayerPlaybackStore = create<PlayerPlaybackStore>()(
	devtools(
		persist(
			(set) => ({
				position: 0,
				setPosition: (position: number) => set({ position }),
			}),
			{
				name: 'player-playback-storage',
				storage: createJSONStorage(() => ({
					...mmkvStateStorage,
					setItem: setPositionItem,
				})),
			},
		),
	),
)

export const usePlaybackPosition = () => usePlayerPlaybackStore((state) => state.position)

export const setPlaybackPosition = usePlayerPlaybackStore.getState().setPosition
