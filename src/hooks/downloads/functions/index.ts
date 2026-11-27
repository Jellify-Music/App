import resolveTrackUrls from '../../../utils/fetching/track-media-info'
import { mapDtosToTracks } from '../../../utils/mapping/item-to-track'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { DownloadManager } from 'react-native-nitro-player'
import { ensureDownloadedTracks } from '../utils'
import useDownloadQueueStore from '../../../stores/download-queue'

export async function downloadItems(items: BaseItemDto[]) {
	// Filter out items that are already downloaded
	const downloadedTracks = await ensureDownloadedTracks()
	const downloadedTrackIds = downloadedTracks.map((t) => t.trackId)
	const itemsToDownload = items.filter((item) => !downloadedTrackIds.includes(item.Id!))

	// the downloader reports a download only by its track ID: this is how to tell what it is part of
	useDownloadQueueStore.getState().record(itemsToDownload)

	const tracks = mapDtosToTracks(itemsToDownload, [])

	const resolvedTracks = await resolveTrackUrls(tracks, 'download')

	await Promise.all(resolvedTracks.map((track) => DownloadManager.downloadTrack(track)))
}
