import { mmkvStateStorage } from '../../constants/storage'
import { JellifyDownloadProgress } from '@/src/types/JellifyDownload'
import JellifyTrack from '@/src/types/JellifyTrack'
import { mapDtoToTrack } from '../../utils/mapping/item-to-track'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import { useApi } from '..'
import { useDownloadingDeviceProfile } from '../device-profile'
import { TrackItem } from 'react-native-nitro-player'

type DownloadsStore = {
	downloadProgress: JellifyDownloadProgress
	setDownloadProgress: (progress: JellifyDownloadProgress) => void
	pendingDownloads: TrackItem[]
	setPendingDownloads: (items: TrackItem[]) => void
	currentDownloads: TrackItem[]
	setCurrentDownloads: (items: TrackItem[]) => void
	completedDownloads: TrackItem[]
	setCompletedDownloads: (items: TrackItem[]) => void
	failedDownloads: TrackItem[]
	setFailedDownloads: (items: TrackItem[]) => void
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
		...pendingDownloads.map((download) => download.id),
		...currentDownloads.map((download) => download.id),
	])

	return (
		items.length !== 0 &&
		(pendingDownloads.length !== 0 || currentDownloads.length !== 0) &&
		items.filter(({ Id }) => downloadQueue.has(Id!)).length > 0
	)
}

export const useAddToCompletedDownloads = () => {
	const currentDownloads = useCurrentDownloads()
	const setCompletedDownloads = useDownloadsStore((state) => state.setCompletedDownloads)

	return (item: TrackItem) => setCompletedDownloads([...currentDownloads, item])
}

export const useAddToCurrentDownloads = () => {
	const currentDownloads = useCurrentDownloads()
	const setCurrentDownloads = useDownloadsStore((state) => state.setCurrentDownloads)

	return (item: TrackItem) => setCurrentDownloads([...currentDownloads, item])
}

export const useRemoveFromCurrentDownloads = () => {
	const currentDownloads = useCurrentDownloads()

	const setCurrentDownloads = useDownloadsStore((state) => state.setCurrentDownloads)

	return (item: TrackItem) =>
		setCurrentDownloads(currentDownloads.filter((download) => download.id !== item.id))
}

export const useRemoveFromPendingDownloads = () => {
	const pendingDownloads = usePendingDownloads()

	const setPendingDownloads = useDownloadsStore((state) => state.setPendingDownloads)

	return (item: TrackItem) =>
		setPendingDownloads(pendingDownloads.filter((download) => download.id !== item.id))
}

export const useAddToFailedDownloads = () => (item: TrackItem) => {
	const failedDownloads = useFailedDownloads()

	const setFailedDownloads = useDownloadsStore((state) => state.setFailedDownloads)

	return setFailedDownloads([...failedDownloads, item])
}

const useAddToPendingDownloads = () => {
	const api = useApi()

	const downloadingDeviceProfile = useDownloadingDeviceProfile()

	const pendingDownloads = usePendingDownloads()

	const setPendingDownloads = useDownloadsStore((state) => state.setPendingDownloads)

	return async (items: BaseItemDto[]) => {
		const downloads = api
			? await Promise.all(items.map((item) => mapDtoToTrack(item, downloadingDeviceProfile)))
			: []

		return setPendingDownloads([...pendingDownloads, ...downloads])
	}
}

export default useAddToPendingDownloads
