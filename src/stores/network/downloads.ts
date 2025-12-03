import { mmkvStateStorage } from '../../constants/storage'
import { JellifyDownloadProgress } from '@/src/types/JellifyDownload'
import JellifyTrack from '@/src/types/JellifyTrack'
import { mapDtoToTrack } from '../../utils/mappings'
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

export const useDownloadProgress = () => useDownloadsStore((state) => state.downloadProgress)

export const usePendingDownloads = () => useDownloadsStore((state) => state.pendingDownloads)

export const useCurrentDownloads = () => useDownloadsStore((state) => state.currentDownloads)

export const useFailedDownloads = () => useDownloadsStore((state) => state.failedDownloads)

export const useIsDownloading = (items: BaseItemDto[]) => {
	const pendingDownloads = usePendingDownloads()
	const currentDownloads = useCurrentDownloads()

	const downloadQueue = new Set([
		...pendingDownloads.map((download) => download.item.Id),
		...currentDownloads.map((download) => download.item.Id),
	])

	const itemIds = items.map((item) => item.Id)

	return itemIds.filter((id) => downloadQueue.has(id)).length === items.length
}

export const useAddToCompletedDownloads = () => {
	const currentDownloads = useCurrentDownloads()
	const setCompletedDownloads = useDownloadsStore((state) => state.setCompletedDownloads)

	return (item: JellifyTrack) => setCompletedDownloads([...currentDownloads, item])
}

export const useAddToCurrentDownloads = () => {
	const currentDownloads = useCurrentDownloads()
	const setCurrentDownloads = useDownloadsStore((state) => state.setCurrentDownloads)

	return (item: JellifyTrack) => setCurrentDownloads([...currentDownloads, item])
}

export const useRemoveFromCurrentDownloads = () => {
	const currentDownloads = useCurrentDownloads()

	const setCurrentDownloads = useDownloadsStore((state) => state.setCurrentDownloads)

	return (item: JellifyTrack) =>
		setCurrentDownloads(
			currentDownloads.filter((download) => download.item.Id !== item.item.Id),
		)
}

export const useRemoveFromPendingDownloads = () => {
	const pendingDownloads = usePendingDownloads()

	const setPendingDownloads = useDownloadsStore((state) => state.setPendingDownloads)

	return (item: JellifyTrack) =>
		setPendingDownloads(
			pendingDownloads.filter((download) => download.item.Id !== item.item.Id),
		)
}

export const useAddToFailedDownloads = () => (item: JellifyTrack) => {
	const failedDownloads = useFailedDownloads()

	const setFailedDownloads = useDownloadsStore((state) => state.setFailedDownloads)

	return setFailedDownloads([...failedDownloads, item])
}

const useAddToPendingDownloads = () => {
	const api = useApi()

	const downloadingDeviceProfile = useDownloadingDeviceProfile()

	const pendingDownloads = usePendingDownloads()

	const setPendingDownloads = useDownloadsStore((state) => state.setPendingDownloads)

	return (items: BaseItemDto[]) => {
		const downloads = api
			? items.map((item) => mapDtoToTrack(api, item, downloadingDeviceProfile))
			: []

		return setPendingDownloads([...pendingDownloads, ...downloads])
	}
}

export default useAddToPendingDownloads
