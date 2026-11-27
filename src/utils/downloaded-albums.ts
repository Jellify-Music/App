import type { DownloadedTrack } from 'react-native-nitro-player'

const ALBUM_ID = /"AlbumId":"([^"]+)"/

/**
 * How many tracks of each album are downloaded, by album ID. A downloaded track carries the track
 * as the server described it, as text; the album's ID is picked out of that rather than reading
 * all of it, as this runs over every download each time one finishes.
 */
export function countDownloadedByAlbum(downloads: DownloadedTrack[]): Record<string, number> {
	const counts: Record<string, number> = {}

	for (const download of downloads) {
		const item = (download.originalTrack?.extraPayload as { item?: string } | undefined)?.item
		const albumId = typeof item === 'string' ? ALBUM_ID.exec(item)?.[1] : undefined

		if (albumId) counts[albumId] = (counts[albumId] ?? 0) + 1
	}

	return counts
}

/** Whether every track of an album is downloaded, which needs the album's number of tracks */
export const isAlbumDownloaded = (
	downloadedCount: number | undefined,
	trackCount: number | null | undefined,
): boolean => Boolean(trackCount && trackCount > 0 && (downloadedCount ?? 0) >= trackCount)
