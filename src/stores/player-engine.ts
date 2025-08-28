import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { useCastState, CastState } from 'react-native-google-cast'
import TrackPlayer from 'react-native-track-player'

export enum PlayerEngine {
	GOOGLE_CAST = 'google_cast',
	CARPLAY = 'carplay',
	REACT_NATIVE_TRACK_PLAYER = 'react_native_track_player',
}

type playerEngineStore = {
	playerEngineData: PlayerEngine
	setPlayerEngineData: (data: PlayerEngine) => void
}

const usePlayerEngineStore = create<playerEngineStore>()(
	devtools(
		persist(
			(set) => ({
				playerEngineData: PlayerEngine.REACT_NATIVE_TRACK_PLAYER,
				setPlayerEngineData: (data: PlayerEngine) => set({ playerEngineData: data }),
			}),
			{
				name: 'player-engine-storage',
			},
		),
	),
)

export const useSelectPlayerEngine = () => {
	const setPlayerEngineData = usePlayerEngineStore((state) => state.setPlayerEngineData)
	const castState = useCastState()
	if (castState === CastState.CONNECTED) {
		setPlayerEngineData(PlayerEngine.GOOGLE_CAST)
		TrackPlayer.pause() // pause the track player to avoid conflicts
		return
	}
	setPlayerEngineData(PlayerEngine.REACT_NATIVE_TRACK_PLAYER)
}

export default usePlayerEngineStore
