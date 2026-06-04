import { PlayerEngine } from '../../enums/player-engine'
import { Device } from 'react-native-google-cast'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

type playerEngineStore = {
	playerEngine: PlayerEngine
	setPlayerEngine: (engine: PlayerEngine) => void

	currentCastDevice: Device | undefined
	setCurrentCastDevice: (device: Device | undefined) => void
}

const usePlayerEngineStore = create<playerEngineStore>()(
	devtools(
		(set) => ({
			playerEngine: PlayerEngine.NITRO_PLAYER,
			setPlayerEngine: (data: PlayerEngine) => set({ playerEngine: data }),

			currentCastDevice: undefined,
			setCurrentCastDevice: (device) => set({ currentCastDevice: device }),
		}),
		{ name: 'player-engine-store' },
	),
)

export const usePlayerEngine = () => usePlayerEngineStore((state) => state.playerEngine)

export const useIsCasting = () => usePlayerEngine() === PlayerEngine.GOOGLE_CAST

export const useCurrentCastDevice = () => {
	const { playerEngine, currentCastDevice } = usePlayerEngineStore()

	return playerEngine === PlayerEngine.GOOGLE_CAST ? currentCastDevice : undefined
}

export default usePlayerEngineStore
