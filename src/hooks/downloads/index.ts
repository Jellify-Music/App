import { useDownloadedTracks } from 'react-native-nitro-player'

const useIsDownloaded = (trackIds: (string | null | undefined)[]) => {
	const { downloadedTracks } = useDownloadedTracks()

	const downloadedTrackIds = new Set(
		downloadedTracks.map((download) => download.originalTrack.id),
	)

	return trackIds.every((id) => id != null && downloadedTrackIds.has(id))
}

export default useIsDownloaded
