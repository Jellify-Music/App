import { DownloadManager, DownloadedTrack, TrackItem } from 'react-native-nitro-player'
import { queryClient } from '../../constants/query-client'
import ALL_DOWNLOADS_KEY from '../../hooks/downloads/keys'
import resolveTrackUrls from '../../utils/fetching/track-media-info'
import { DiskSnapshot } from '../core/types'

/**
 * The storage boundary the cache engine's effects are executed against.
 * Kept as an interface so service tests can run against a fake without
 * mocking native modules.
 */
export type CacheStorageAdapter = {
	/** Resolve a download-quality URL for the track and start the download */
	fetch: (track: TrackItem) => Promise<void>
	/** Delete a track's files; idempotent for tracks that aren't on disk */
	evict: (trackId: string) => Promise<void>
	/** Disk truth: everything downloaded plus everything in flight */
	snapshot: () => Promise<DiskSnapshot>
}

/** In-flight download states reported by the nitro DownloadManager */
const ACTIVE_DOWNLOAD_STATES = ['pending', 'downloading', 'paused']

export const nitroStorageAdapter: CacheStorageAdapter = {
	async fetch(track: TrackItem) {
		const [resolved] = await resolveTrackUrls([track], 'download')
		await DownloadManager.downloadTrack(resolved)
	},

	async evict(trackId: string) {
		await DownloadManager.deleteDownloadedTrack(trackId)

		queryClient.setQueryData(ALL_DOWNLOADS_KEY, (oldData: DownloadedTrack[] | undefined) =>
			oldData ? oldData.filter((download) => download.trackId !== trackId) : [],
		)
	},

	async snapshot() {
		const downloaded = await DownloadManager.getAllDownloadedTracks()
		const active = DownloadManager.getActiveDownloads()

		return {
			present: downloaded.map((download) => ({
				trackId: download.trackId,
				sizeBytes: download.fileSize ?? 0,
			})),
			fetching: active
				.filter((task) => ACTIVE_DOWNLOAD_STATES.includes(task.state))
				.map((task) => task.trackId),
		}
	},
}
