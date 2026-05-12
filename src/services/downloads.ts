import { DownloadedTrack, DownloadManager } from 'react-native-nitro-player'
import { queryClient } from '../constants/query-client'
import ALL_DOWNLOADS_KEY from '../hooks/downloads/keys'
import { MAX_CONCURRENT_DOWNLOADS } from '../configs/download.config'
import { MAX_RETRY_ATTEMPTS } from '../configs/query.config'

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
		queryClient.setQueryData(ALL_DOWNLOADS_KEY, (oldData: DownloadedTrack[] | undefined) => {
			if (!oldData) return [download]
			return [...oldData, download]
		})
	})
}
