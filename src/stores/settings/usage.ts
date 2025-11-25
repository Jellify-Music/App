import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import { mmkvStateStorage } from '../../constants/storage'
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

				autoDownload: false,
				setAutoDownload: (autoDownload) => set({ autoDownload }),
			}),
			{
				name: 'usage-settings-storage',
				storage: createJSONStorage(() => mmkvStateStorage),
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
