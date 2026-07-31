import { DownloadedTrack, DownloadManager } from 'react-native-nitro-player'
import { queryClient } from '../constants/query-client'
import ALL_DOWNLOADS_KEY from '../hooks/downloads/keys'
import { MAX_CONCURRENT_DOWNLOADS } from '../configs/download.config'
import { MAX_RETRY_ATTEMPTS } from '../configs/query.config'
import { cacheService } from '../cache/service'

export default function configureDownloadManager() {
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
		// Upsert by track id so a re-downloaded track replaces its old entry
		// instead of duplicating it
		queryClient.setQueryData(ALL_DOWNLOADS_KEY, (oldData: DownloadedTrack[] | undefined) => {
			if (!oldData) return [download]
			return [
				...oldData.filter((existing) => existing.trackId !== download.trackId),
				download,
			]
		})

		cacheService.notifyDownloadCompleted(download)
	})

	DownloadManager.onDownloadStateChange((_downloadId, trackId, state, error) => {
		if (state === 'failed') {
			cacheService.notifyDownloadFailed(
				trackId,
				error?.isRetryable ?? true,
				error?.reason === 'storage_full',
			)
		} else if (state === 'cancelled') {
			// A cancelled download can always be tried again later
			cacheService.notifyDownloadFailed(trackId, true, false)
		}
	})
}
