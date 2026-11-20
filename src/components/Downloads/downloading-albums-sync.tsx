import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { DownloadedTrack } from 'react-native-nitro-player'
import ALL_DOWNLOADS_QUERY from '../../hooks/downloads/queries'
import { countDownloadedByAlbum } from '../../utils/downloaded-albums'
import { useDownloadingAlbums } from '../../hooks/downloads/queue'
import useDownloadingAlbumsStore from '../../stores/downloading-albums'

/** at module level so the answer is only worked out again when the downloads change */
const selectCounts = (downloads: DownloadedTrack[]) => countDownloadedByAlbum(downloads)

/**
 * Keeps how far along each album that is downloading is, and how much of each is downloaded, up to
 * date for the rows that show it. Draws nothing.
 */
export default function DownloadingAlbumsSync(): null {
	const groups = useDownloadingAlbums()

	const set = useDownloadingAlbumsStore((state) => state.set)
	const setDownloaded = useDownloadingAlbumsStore((state) => state.setDownloaded)

	const { data: counts } = useQuery({ ...ALL_DOWNLOADS_QUERY, select: selectCounts })

	// the key is what the progress is made of, so the effect runs when it changes and not on every render
	const key = groups.map((group) => `${group.albumId}:${group.progress}`).join(',')

	useEffect(() => {
		set(
			Object.fromEntries(
				groups.flatMap((group) => (group.albumId ? [[group.albumId, group.progress]] : [])),
			),
		)
	}, [key])

	useEffect(() => {
		if (counts) setDownloaded(counts)
	}, [counts])

	return null
}
