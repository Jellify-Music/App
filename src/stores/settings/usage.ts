import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import { Platform } from 'react-native'
import { stateStorage } from '../../constants/storage'
import StreamingQuality from '../../enums/audio-quality'

export type DownloadQuality = StreamingQuality

type UsageSettingsStore = {
	downloadQuality: DownloadQuality
	setDownloadQuality: (downloadQuality: DownloadQuality) => void

	autoDownload: boolean
	setAutoDownload: (autoDownload: boolean) => void
}

export const useUsageSettingsStore = create<UsageSettingsStore>()(
	devtools(
		persist(
			(set) => ({
				downloadQuality: StreamingQuality.Original,
				setDownloadQuality: (downloadQuality: DownloadQuality) => set({ downloadQuality }),

				autoDownload: Platform.OS === 'android' || Platform.OS === 'ios',
				setAutoDownload: (autoDownload) => set({ autoDownload }),
			}),
			{
				name: 'usage-settings-storage',
				storage: createJSONStorage(() => stateStorage),
			},
		),
	),
)

export const useAutoDownload: () => [boolean, (autoDownload: boolean) => void] = () => {
	const autoDownload = useUsageSettingsStore((state) => state.autoDownload)

	const setAutoDownload = useUsageSettingsStore((state) => state.setAutoDownload)

	return [autoDownload, setAutoDownload]
}

export const useDownloadQuality: () => [
	DownloadQuality,
	(downloadQuality: DownloadQuality) => void,
] = () => {
	const downloadQuality = useUsageSettingsStore((state) => state.downloadQuality)

	const setDownloadQuality = useUsageSettingsStore((state) => state.setDownloadQuality)

	return [downloadQuality, setDownloadQuality]
}
