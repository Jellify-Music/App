import { DownloadManager } from 'react-native-nitro-player'
import type { DownloadTask } from 'react-native-nitro-player/lib/types/DownloadTypes'

/** Whether a download is under way or waiting its turn, as opposed to finished, failed or cancelled */
export const isActiveDownload = (task: Pick<DownloadTask, 'state'>): boolean =>
	task.state === 'pending' || task.state === 'downloading' || task.state === 'paused'

/**
 * Stops the downloads of these tracks, running or waiting. Only these: whatever else is
 * downloading carries on, and tracks already downloaded stay. A download that cannot be cancelled,
 * because it has just finished, say, is not an error.
 */
export async function cancelDownloadsOf(trackIds: ReadonlySet<string>): Promise<void> {
	const tasks = DownloadManager.getActiveDownloads().filter(
		(task) => trackIds.has(task.trackId) && isActiveDownload(task),
	)

	await Promise.allSettled(tasks.map((task) => DownloadManager.cancelDownload(task.downloadId)))
}
