import { PlayerEngine } from '../../enums/player-engine'
// Google Cast (react-native-google-cast) removed — casting is now handled
// natively by react-native-nitro-player (it auto-routes playback to the device).
// import { Device } from 'react-native-google-cast'
import {
	useIsCasting as useNitroIsCasting,
	useCastState,
} from 'react-native-nitro-player'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

type playerEngineStore = {
	playerEngine: PlayerEngine
	setPlayerEngine: (engine: PlayerEngine) => void

	// Was react-native-google-cast `Device`; now just the device name (or undefined).
	currentCastDevice: string | undefined
	setCurrentCastDevice: (device: string | undefined) => void
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

// Casting state now comes from nitro-player's native Cast backend.
export const useIsCasting = () => useNitroIsCasting()

export const useCurrentCastDevice = () => useCastState().deviceName ?? undefined

export default usePlayerEngineStore
