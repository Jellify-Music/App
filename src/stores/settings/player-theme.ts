import { mmkvStateStorage } from '../../constants/storage'
import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'

export type PlayerThemeId = 'default' | 'cassette'

type PlayerThemeStore = {
	playerTheme: PlayerThemeId
	setPlayerTheme: (theme: PlayerThemeId) => void
}

export const usePlayerThemeStore = create<PlayerThemeStore>()(
	devtools(
		persist(
			(set): PlayerThemeStore => ({
				playerTheme: 'default',
				setPlayerTheme: (playerTheme: PlayerThemeId) => set({ playerTheme }),
			}),
			{
				name: 'player-theme-storage',
				storage: createJSONStorage(() => mmkvStateStorage),
			},
		),
	),
)

export const usePlayerTheme: () => [PlayerThemeId, (theme: PlayerThemeId) => void] = () => {
	const playerTheme = usePlayerThemeStore((state) => state.playerTheme)
	const setPlayerTheme = usePlayerThemeStore((state) => state.setPlayerTheme)
	return [playerTheme, setPlayerTheme]
}
