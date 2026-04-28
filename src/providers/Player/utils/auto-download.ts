// Track IDs for which we've already triggered (or confirmed) an auto-download this session.

import { DownloadManager } from 'react-native-nitro-player'
import { useUsageSettingsStore } from '../../../stores/settings/usage'
import { TrackItem } from 'react-native-nitro-player/lib/types/PlayerQueue'
import resolveTrackUrls from '../../../utils/fetching/track-media-info'

// Prevents redundant DownloadManager checks on every progress tick after the 30% threshold.
const autoDownloadTriggered = new Set<string>()

export default async function handleAutoDownload(
	position: number,
	totalDuration: number,
	track: TrackItem,
) {
	const { autoDownload } = useUsageSettingsStore.getState()

	if (position / totalDuration > 0.3 && track && autoDownload) {
		// Fail fast if we've already triggered an auto-download for this track this session
		if (autoDownloadTriggered.has(track.id)) return

		// Mark this track as having triggered an auto-download to prevent redundant checks
		autoDownloadTriggered.add(track.id)

		const isDownloadedOrDownloadPending =
			(await DownloadManager.isTrackDownloaded(track?.id ?? '')) ||
			(await DownloadManager.isDownloading(track?.id ?? ''))

		if (isDownloadedOrDownloadPending) return

		// Re-resolve the track URL using the download profile, not the stream profile
		const [downloadTrack] = await resolveTrackUrls([track], 'download')
		await DownloadManager.downloadTrack(downloadTrack)
	}
}
