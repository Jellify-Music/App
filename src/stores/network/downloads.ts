import { mmkvStateStorage } from '@/src/constants/storage'
import { JellifyDownloadProgress } from '@/src/types/JellifyDownload'
import JellifyTrack from '@/src/types/JellifyTrack'
import { mapDtoToTrack } from '@/src/utils/mappings'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import { useApi } from '..'
import { useDownloadingDeviceProfile } from '../device-profile'

type DownloadsStore = {
	downloadProgress: JellifyDownloadProgress
	setDownloadProgress: (progress: JellifyDownloadProgress) => void
	pendingDownloads: JellifyTrack[]
	setPendingDownloads: (items: JellifyTrack[]) => void
	currentDownloads: JellifyTrack[]
	setCurrentDownloads: (items: JellifyTrack[]) => void
	completedDownloads: JellifyTrack[]
	setCompletedDownloads: (items: JellifyTrack[]) => void
	failedDownloads: JellifyTrack[]
	setFailedDownloads: (items: JellifyTrack[]) => void
}

export const useDownloadsStore = create<DownloadsStore>()(
	devtools(
		persist(
			(set) => ({
				downloadProgress: {},
				setDownloadProgress: (progress) =>
					set({
						downloadProgress: progress,
					}),
				pendingDownloads: [],
				setPendingDownloads: (items) =>
					set({
						pendingDownloads: items,
					}),
				currentDownloads: [],
				setCurrentDownloads: (items) => set({ currentDownloads: items }),
				completedDownloads: [],
				setCompletedDownloads: (items) => set({ completedDownloads: items }),
				failedDownloads: [],
				setFailedDownloads: (items) => set({ failedDownloads: items }),
			}),
			{
				name: 'downloads-store',
				storage: createJSONStorage(() => mmkvStateStorage),
			},
		),
	),
)

export const usePendingDownloads = () => useDownloadsStore((state) => state.pendingDownloads)

export const useCurrentDownloads = () => useDownloadsStore((state) => state.currentDownloads)

export const useAddToCompletedDownloads = () => (item: JellifyTrack) => {
	const currentDownloads = useCurrentDownloads()

	const setCompletedDownloads = useDownloadsStore((state) => state.setCompletedDownloads)

	return setCompletedDownloads([])
}

export const useAddToCurrentDownloads = () => (item: JellifyTrack) => {
	const currentDownloads = useCurrentDownloads()

	const setCurrentDownloads = useDownloadsStore((state) => state.setCurrentDownloads)

	return setCurrentDownloads([...currentDownloads, item])
}

export const useRemoveFromCurrentDownloads = () => (item: JellifyTrack) => {
	const currentDownloads = useCurrentDownloads()

	const setCurrentDownloads = useDownloadsStore((state) => state.setCurrentDownloads)

	return setCurrentDownloads(
		currentDownloads.filter((download) => download.item.Id !== item.item.Id),
	)
}

export const useRemoveFromPendingDownloads = () => (item: JellifyTrack) => {
	const pendingDownloads = usePendingDownloads()

	const setPendingDownloads = useDownloadsStore((state) => state.setPendingDownloads)

	return setPendingDownloads(
		pendingDownloads.filter((download) => download.item.Id !== item.item.Id),
	)
}

const useAddToPendingDownloads = () => (items: BaseItemDto[]) => {
	const api = useApi()

	const downloadingDeviceProfile = useDownloadingDeviceProfile()

	const pendingDownloads = usePendingDownloads()

	const setPendingDownloads = useDownloadsStore((state) => state.setPendingDownloads)

	const downloads = api
		? items.map((item) => mapDtoToTrack(api, item, downloadingDeviceProfile))
		: []

	return setPendingDownloads([...pendingDownloads, ...downloads])
}

export default useAddToPendingDownloads
