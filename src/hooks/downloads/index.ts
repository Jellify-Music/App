import { useQuery } from '@tanstack/react-query'
import ALL_DOWNLOADS_QUERY from './queries'

const useDownloads = () => useQuery(ALL_DOWNLOADS_QUERY)

export const useIsDownloaded = (trackIds: (string | null | undefined)[]) => {
	const { data: downloadedTracks } = useDownloads()

	return trackIds.every((id) =>
		downloadedTracks?.some((download) => download.originalTrack.id === id),
	)
}

export default useDownloads
