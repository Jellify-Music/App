import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import { mmkvStateStorage } from '../../../constants/storage'
import { StreamingQuality } from '../../../enums/audio-quality'
import { DEFAULT_PLAYER_LOOKAHEAD } from '../../../configs/player/index.config'
import { PlayerSettingsStore } from './types'
import { setStreamingQuality, setEnableAudioNormalization, setLookahead } from './utils/set'

export const usePlayerSettingsStore = create<PlayerSettingsStore>()(
	devtools(
		persist(
			(set) => ({
				streamingQuality: StreamingQuality.Original,
				setStreamingQuality: setStreamingQuality(set),

				enableAudioNormalization: false,

				setEnableAudioNormalization: setEnableAudioNormalization(set),

				displayAudioQualityBadge: false,
				setDisplayAudioQualityBadge: (displayAudioQualityBadge) =>
					set({ displayAudioQualityBadge }),

				lookahead: DEFAULT_PLAYER_LOOKAHEAD,
				setLookahead: setLookahead(set),
			}),
			{
				name: 'player-settings-storage',
				storage: createJSONStorage(() => mmkvStateStorage),
			},
		),
	),
)

export const useStreamingQuality: () => [
	StreamingQuality,
	(streamingQuality: StreamingQuality) => void,
] = () => {
	const streamingQuality = usePlayerSettingsStore((state) => state.streamingQuality)
	const setStreamingQuality = usePlayerSettingsStore((state) => state.setStreamingQuality)

	return [streamingQuality, setStreamingQuality]
}

export const useEnableAudioNormalization: () => [boolean, (enabled: boolean) => void] = () => {
	const enableAudioNormalization = usePlayerSettingsStore(
		(state) => state.enableAudioNormalization,
	)

	const setEnableAudioNormalization = usePlayerSettingsStore(
		(state) => state.setEnableAudioNormalization,
	)

	return [enableAudioNormalization, setEnableAudioNormalization]
}

export const useDisplayAudioQualityBadge: () => [
	boolean,
	(displayAudioQualityBadge: boolean) => void,
] = () => {
	const displayAudioQualityBadge = usePlayerSettingsStore(
		(state) => state.displayAudioQualityBadge,
	)

	const setDisplayAudioQualityBadge = usePlayerSettingsStore(
		(state) => state.setDisplayAudioQualityBadge,
	)

	return [displayAudioQualityBadge, setDisplayAudioQualityBadge]
}
