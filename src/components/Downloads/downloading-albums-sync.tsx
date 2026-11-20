import { useEffect } from 'react'
import { useDownloadingAlbums } from '../../hooks/downloads/queue'
import useDownloadingAlbumsStore from '../../stores/downloading-albums'

/** Keeps the progress of the albums that are downloading up to date for the rows that show it. Draws nothing. */
export default function DownloadingAlbumsSync(): null {
	const groups = useDownloadingAlbums()

	const set = useDownloadingAlbumsStore((state) => state.set)

	// the key is what the progress is made of, so the effect runs when it changes and not on every render
	const key = groups.map((group) => `${group.albumId}:${group.progress}`).join(',')

	useEffect(() => {
		set(
			Object.fromEntries(
				groups.flatMap((group) => (group.albumId ? [[group.albumId, group.progress]] : [])),
			),
		)
	}, [key])

	return null
}
