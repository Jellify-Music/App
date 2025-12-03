import { useEffect } from 'react'
import {
	useAddToCompletedDownloads,
	useAddToCurrentDownloads,
	useAddToFailedDownloads,
	useDownloadsStore,
	useRemoveFromCurrentDownloads,
	useRemoveFromPendingDownloads,
} from '../stores/network/downloads'
import { MAX_CONCURRENT_DOWNLOADS } from '../configs/download.config'
import { useAllDownloadedTracks } from '../api/queries/download'
import { saveAudio } from '../api/mutations/download/offlineModeUtils'

const useDownloadProcessor = () => {
	const { pendingDownloads, currentDownloads } = useDownloadsStore()

	const { data: downloadedTracks } = useAllDownloadedTracks()

	const addToCurrentDownloads = useAddToCurrentDownloads()

	const removeFromCurrentDownloads = useRemoveFromCurrentDownloads()

	const removeFromPendingDownloads = useRemoveFromPendingDownloads()

	const addToCompletedDownloads = useAddToCompletedDownloads()

	const addToFailedDownloads = useAddToFailedDownloads()

	const { refetch: refetchDownloadedTracks } = useAllDownloadedTracks()

	return useEffect(() => {
		if (pendingDownloads.length > 0 && currentDownloads.length < MAX_CONCURRENT_DOWNLOADS) {
			const availableSlots = MAX_CONCURRENT_DOWNLOADS - currentDownloads.length
			const filesToStart = pendingDownloads.slice(0, availableSlots)

			console.debug('Downloading from queue')

			filesToStart.forEach((file) => {
				addToCurrentDownloads(file)
				removeFromPendingDownloads(file)
				if (downloadedTracks?.some((t) => t.item.Id === file.item.Id)) {
					removeFromCurrentDownloads(file)
					addToCompletedDownloads(file)
					return
				}

				saveAudio(file, () => {}, false).then((success) => {
					removeFromCurrentDownloads(file)

					if (success) {
						addToCompletedDownloads(file)
					} else {
						addToFailedDownloads(file)
					}
				})
			})
		}
		if (pendingDownloads.length === 0 && currentDownloads.length === 0) {
			refetchDownloadedTracks()
		}
	}, [pendingDownloads.length, currentDownloads.length])
}

export default useDownloadProcessor
