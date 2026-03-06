import resolveTrackUrls from '../../../utils/fetching/track-media-info'
import reportPlaybackCompleted from '../../../api/mutations/playback/functions/playback-completed'
import reportPlaybackProgress from '../../../api/mutations/playback/functions/playback-progress'
import reportPlaybackStarted from '../../../api/mutations/playback/functions/playback-started'
import reportPlaybackStopped from '../../../api/mutations/playback/functions/playback-stopped'
import isPlaybackFinished from '../../../api/mutations/playback/utils'
import { usePlayerPlaybackStore } from '../../../stores/player/playback'
import { usePlayerQueueStore } from '../../../stores/player/queue'
import { usePlayerSettingsStore } from '../../../stores/settings/player'
import { useUsageSettingsStore } from '../../../stores/settings/usage'
import calculateTrackVolume from '../../../utils/audio/normalization'
import { TRACKPLAYER_LOOKAHEAD_COUNT } from '../../../configs/player.config'
import {
	TrackPlayer,
	DownloadManager,
	Reason,
	TrackPlayerState,
	TrackItem,
} from 'react-native-nitro-player'

// Track IDs for which we've already triggered (or confirmed) an auto-download this session.
// Prevents redundant DownloadManager checks on every progress tick after the 30% threshold.
const autoDownloadTriggered = new Set<string>()

/**
 * Core URL-resolution logic. Fetches fresh playback info for each track,
 * builds updated track objects, calls TrackPlayer.updateTracks and syncs
 * the JS queue store. Has no guards — callers are responsible for gating.
 */
export async function updateTrackMediaInfo(tracks: TrackItem[]) {
	const updatedTracks = await resolveTrackUrls(tracks, 'stream')

	await TrackPlayer.updateTracks(updatedTracks)

	const { queue: persistedQueue } = usePlayerQueueStore.getState()

	usePlayerQueueStore.setState((state) => ({
		...state,
		queue: persistedQueue.map((t) => {
			const updatedTrack = updatedTracks.find((ut) => ut.id === t.id)
			return updatedTrack ?? t
		}),
	}))
}

/**
 * Native callback — skipped while a queuing operation is in progress to
 * prevent races with the explicit resolveTrackUrls call in useLoadNewQueue.
 */
export async function onTracksNeedUpdate(tracks: TrackItem[], _lookahead: number) {
	const { isQueuing } = usePlayerQueueStore.getState()
	if (isQueuing) {
		console.info('onTracksNeedUpdate: skipping during queue load')
		return
	}
	await updateTrackMediaInfo(tracks)
}

export async function onChangeTrack(track: TrackItem, reason?: Reason) {
	const { isQueuing } = usePlayerQueueStore.getState()

	// If we're in the middle of queuing a new playlist, we can skip reporting playback changes
	if (isQueuing) {
		console.info('Skipping playback reporting due to ongoing queue change')
		return
	}

	// Grab snapshot of the previous track and playback position for reporting
	const { queue: prevQueue, currentIndex: prevIndex } = usePlayerQueueStore.getState()
	const previousTrack = prevIndex !== undefined ? prevQueue[prevIndex] : undefined
	const lastPosition = usePlayerPlaybackStore.getState().position

	// Find the new index from the existing store queue by track ID.
	const currentIndex = prevQueue.findIndex((t) => t.id === track.id)

	// Update the store immediately so the UI reflects the new track without waiting for network
	usePlayerQueueStore.setState((state) => ({
		...state,
		currentIndex: currentIndex !== -1 ? currentIndex : prevIndex,
	}))

	if (previousTrack && isPlaybackFinished(lastPosition, previousTrack.duration)) {
		reportPlaybackCompleted(previousTrack)
	} else if (previousTrack) {
		reportPlaybackStopped(previousTrack, lastPosition)
	}

	reportPlaybackStarted(track, 0)

	// Proactively resolve URLs for upcoming tracks so the native player can buffer
	// them for gapless playback before onTracksNeedUpdate fires.
	TrackPlayer.getNextTracks(TRACKPLAYER_LOOKAHEAD_COUNT)
		.then((upcomingTracks) => {
			const unresolved = upcomingTracks.filter((t) => !t.url)
			if (unresolved.length > 0) return updateTrackMediaInfo(unresolved)
		})
		.catch((err) => console.warn('Failed to preload lookahead URLs', err))

	// Apply audio normalization if enabled in settings
	const { enableAudioNormalization } = usePlayerSettingsStore.getState()
	if (enableAudioNormalization) {
		const volume = calculateTrackVolume(track)
		TrackPlayer.setVolume(volume)
	}
}

export async function onPlaybackProgress(position: number, totalDuration: number) {
	usePlayerPlaybackStore.setState({
		position,
	})

	const { queue, currentIndex } = usePlayerQueueStore.getState()
	const currentTrack = currentIndex !== undefined ? queue[currentIndex] : undefined

	if (!currentTrack) return

	reportPlaybackProgress(currentTrack, position)

	const { autoDownload } = useUsageSettingsStore.getState()

	if (position / totalDuration > 0.3 && currentTrack && autoDownload) {
		// Fail fast if we've already triggered an auto-download for this track this session
		if (autoDownloadTriggered.has(currentTrack.id)) return

		// Mark this track as having triggered an auto-download to prevent redundant checks
		autoDownloadTriggered.add(currentTrack.id)

		const isDownloadedOrDownloadPending =
			(await DownloadManager.isTrackDownloaded(currentTrack?.id ?? '')) ||
			(await DownloadManager.isDownloading(currentTrack?.id ?? ''))

		if (isDownloadedOrDownloadPending) return
		DownloadManager.downloadTrack(currentTrack).catch((err) => {
			console.error('Failed to download track', err)
		})
	}
}

export function onPlaybackStateChange(state: TrackPlayerState, reason: Reason | undefined) {
	const { queue, currentIndex } = usePlayerQueueStore.getState()
	const currentTrack = currentIndex !== undefined ? queue[currentIndex] : undefined
	const position = usePlayerPlaybackStore.getState().position

	if (!currentTrack || reason === 'skip') return

	if (['paused', 'stopped'].includes(state)) {
		if (isPlaybackFinished(position, currentTrack.duration)) {
			reportPlaybackCompleted(currentTrack)
		} else {
			reportPlaybackStopped(currentTrack, position)
		}
	} else if (state === 'playing') {
		reportPlaybackStarted(currentTrack, position)
	}
}
