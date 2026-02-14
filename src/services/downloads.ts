import { DownloadManager } from 'react-native-nitro-player'

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
}
