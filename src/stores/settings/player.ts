import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import { mmkvStateStorage } from '../../constants/storage'
import { useStreamingDeviceProfileStore } from '../device-profile'
import { useEffect } from 'react'
import { getDeviceProfile } from '../../utils/device-profiles'
import StreamingQuality from '../../enums/audio-quality'

type PlayerSettingsStore = {
	streamingQuality: StreamingQuality
	setStreamingQuality: (streamingQuality: StreamingQuality) => void

	enableAudioNormalization: boolean
	setEnableAudioNormalization: (enabled: boolean) => void

	displayAudioQualityBadge: boolean
	setDisplayAudioQualityBadge: (displayAudioQualityBadge: boolean) => void
}

export const usePlayerSettingsStore = create<PlayerSettingsStore>()(
	devtools(
		persist(
			(set) => ({
				streamingQuality: StreamingQuality.Original,
				setStreamingQuality: (streamingQuality) => set({ streamingQuality }),

				enableAudioNormalization: false,
				setEnableAudioNormalization: (enabled) =>
					set({ enableAudioNormalization: enabled }),

				displayAudioQualityBadge: false,
				setDisplayAudioQualityBadge: (displayAudioQualityBadge) =>
					set({ displayAudioQualityBadge }),
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

	const setStreamingDeviceProfile = useStreamingDeviceProfileStore(
		(state) => state.setDeviceProfile,
	)

	useEffect(() => {
		setStreamingDeviceProfile(getDeviceProfile(streamingQuality, 'stream'))
	}, [streamingQuality])

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
