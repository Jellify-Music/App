import { useQuery } from '@tanstack/react-query'
import type { DownloadedTrack } from 'react-native-nitro-player'
import ALL_DOWNLOADS_QUERY from './queries'

const useDownloads = () => useQuery(ALL_DOWNLOADS_QUERY)

/**
 * Stable `select` that converts the downloaded track list into a `Set<string>`
 * of track ids. Defined at module scope so React Query treats it as
 * referentially stable and only re-runs when the cached data changes. The
 * resulting Set is shared across all consumers via React Query's structural
 * sharing of `select` results.
 */
const selectDownloadedIds = (downloads: DownloadedTrack[]): Set<string> =>
	new Set(downloads.map((d) => d.originalTrack.id))

const DOWNLOADED_IDS_QUERY = {
	...ALL_DOWNLOADS_QUERY,
	select: selectDownloadedIds,
}

/**
 * Returns true if the given track id is currently downloaded. O(1) per call.
 *
 * Replaces the previous `useIsDownloaded([id])` shape, which created a fresh
 * array on every render and walked the entire downloads list with
 * `Array.prototype.every` + `Array.prototype.some` (O(downloads × ids) per
 * call). With thousands of tracks visible across Track rows, that became a
 * dominant cost on Android perf reports.
 */
export const useIsDownloaded = (trackId: string | null | undefined): boolean => {
	const { data: downloadedIds } = useQuery(DOWNLOADED_IDS_QUERY)

	if (!trackId) return false
	return downloadedIds?.has(trackId) ?? false
}

/**
 * Returns true if every supplied track id is currently downloaded. Used by
 * album / playlist headers and the context menu to decide whether the whole
 * collection is offline.
 *
 * O(ids.length) per call (no longer O(ids.length × downloads.length)).
 *
 * Matches the previous semantics: an empty array returns `true` (vacuously),
 * and a missing/empty id is treated as not downloaded.
 */
export const useAreAllDownloaded = (trackIds: (string | null | undefined)[]): boolean => {
	const { data: downloadedIds } = useQuery(DOWNLOADED_IDS_QUERY)

	return trackIds.every((id) => (id ? (downloadedIds?.has(id) ?? false) : false))
}

export default useDownloads
