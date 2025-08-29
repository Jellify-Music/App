import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import { stateStorage } from '../../constants/storage'
import { useStreamingDeviceProfileStore } from '../device-profile'
import { useEffect } from 'react'
import { getDeviceProfile } from '../../utils/device-profiles'

export enum StreamingQuality {
	Original = 'original', // Direct Play
	High = 'high', // 320
	Medium = 'medium', // 256
	Low = 'low', // 128
}

type PlayerSettingsStore = {
	streamingQuality: StreamingQuality
	setStreamingQuality: (streamingQuality: StreamingQuality) => void

	displayAudioQualityBadge: boolean
	setDisplayAudioQualityBadge: (displayAudioQualityBadge: boolean) => void
}

export const usePlayerSettingsStore = create<PlayerSettingsStore>()(
	devtools(
		persist(
			(set) => ({
				streamingQuality: StreamingQuality.Original,
				setStreamingQuality: (streamingQuality) => set({ streamingQuality }),

				displayAudioQualityBadge: false,
				setDisplayAudioQualityBadge: (displayAudioQualityBadge) =>
					set({ displayAudioQualityBadge }),
			}),
			{
				name: 'player-settings-storage',
				storage: createJSONStorage(() => stateStorage),
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
