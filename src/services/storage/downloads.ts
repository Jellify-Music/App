import { DownloadedTrack, DownloadManager } from 'react-native-nitro-player'
import { queryClient } from '../../api/client'
import ALL_DOWNLOADS_KEY from '../../hooks/downloads/keys'
import { MAX_CONCURRENT_DOWNLOADS } from '../../configs/networking/download.config'
import { MAX_RETRY_ATTEMPTS } from '../../configs/querying/index.config'
import useDownloadQueueStore, { hydrateDownloadQueue } from '../../stores/download-queue'

export function configureDownloadManager() {
	// what was queued before the app was last closed: those downloads carry on without it
	hydrateDownloadQueue()

	DownloadManager.configure({
		maxConcurrentDownloads: MAX_CONCURRENT_DOWNLOADS,
		autoRetry: true,
		maxRetryAttempts: MAX_RETRY_ATTEMPTS,
		backgroundDownloadsEnabled: true,
		downloadArtwork: true,
		wifiOnlyDownloads: false,
		storageLocation: 'private', // 'private' or 'public'
	})

	DownloadManager.onDownloadComplete((download) => {
		useDownloadQueueStore.getState().markDone(download.trackId)

		queryClient.setQueryData(ALL_DOWNLOADS_KEY, (oldData: DownloadedTrack[] | undefined) => {
			if (!oldData) return [download]
			return [...oldData, download]
		})
	})
}
