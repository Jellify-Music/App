import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export enum PlayerEngine {
	GOOGLE_CAST = 'google_cast',
	CARPLAY = 'carplay',
	NITRO_PLAYER = 'nitro_player',
}

type playerEngineStore = {
	playerEngine: PlayerEngine
	setPlayerEngine: (engine: PlayerEngine) => void
}

const usePlayerEngineStore = create<playerEngineStore>()(
	devtools(
		(set) => ({
			playerEngine: PlayerEngine.NITRO_PLAYER,
			setPlayerEngine: (data: PlayerEngine) => set({ playerEngine: data }),
		}),
		{ name: 'player-engine-store' },
	),
)

export const usePlayerEngine = () => usePlayerEngineStore((state) => state.playerEngine)

export default usePlayerEngineStore
