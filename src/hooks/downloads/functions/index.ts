import resolveTrackUrls from '../../../utils/fetching/track-media-info'
import { mapDtosToTracks } from '../../../utils/mapping/item-to-track'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { DownloadManager } from 'react-native-nitro-player'
import { ensureDownloadedTracks } from '../utils'
import { isActiveDownload } from './cancel'

/**
 * Hands tracks to the downloader.
 *
 * @param items The tracks. Those that are downloaded, or already downloading or waiting, are left out.
 * @param signal Aborting it stops tracks being handed over, if it has not happened yet
 */
export async function downloadItems(items: BaseItemDto[], signal?: AbortSignal) {
	// Filter out items that are already downloaded
	const downloadedTracks = await ensureDownloadedTracks()
	const downloadedTrackIds = downloadedTracks.map((t) => t.trackId)

	// ...and those the downloader already has, so that asking again does not queue them twice
	const activeTrackIds = new Set(
		DownloadManager.getActiveDownloads()
			.filter(isActiveDownload)
			.map((task) => task.trackId),
	)

	const itemsToDownload = items.filter(
		(item) => !downloadedTrackIds.includes(item.Id!) && !activeTrackIds.has(item.Id!),
	)

	const tracks = mapDtosToTracks(itemsToDownload, [])

	const resolvedTracks = await resolveTrackUrls(tracks, 'download', signal)

	// stopped while the playback info was being looked up: hand nothing over
	if (signal?.aborted) return

	await Promise.all(resolvedTracks.map((track) => DownloadManager.downloadTrack(track)))
}
