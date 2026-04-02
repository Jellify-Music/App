import { DownloadedTrack, DownloadManager } from 'react-native-nitro-player'
import { queryClient } from '../constants/query-client'
import ALL_DOWNLOADS_KEY from '../hooks/downloads/keys'

export default function configureDownloadManager() {
	DownloadManager.configure({
		maxConcurrentDownloads: 3,
		autoRetry: true,
		maxRetryAttempts: 3,
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
