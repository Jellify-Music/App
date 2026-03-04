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
import {
	TrackPlayer,
	DownloadManager,
	Reason,
	TrackPlayerState,
	TrackItem,
	PlayerQueue,
} from 'react-native-nitro-player'

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
export async function onTracksNeedUpdate(tracks: TrackItem[]) {
	const { isQueuing } = usePlayerQueueStore.getState()
	if (isQueuing) {
		console.info('onTracksNeedUpdate: skipping during queue load')
		return
	}
	await updateTrackMediaInfo(tracks)
}

export async function onChangeTrack() {
	const { isQueuing } = usePlayerQueueStore.getState()

	// If we're in the middle of queuing a new playlist, we can skip reporting playback changes
	if (isQueuing) {
		console.info('Skipping playback reporting due to ongoing queue change')
		return
	}

	const { currentIndex } = await TrackPlayer.getState()
	const actualQueue = await TrackPlayer.getActualQueue()

	// Get the last track and the last known position...
	const { queue: prevQueue, currentIndex: prevIndex } = usePlayerQueueStore.getState()
	const previousTrack = prevIndex !== undefined ? prevQueue[prevIndex] : undefined
	const lastPosition = usePlayerPlaybackStore.getState().position

	// ...report that playback has stopped for the previous track, including the last position
	if (previousTrack && isPlaybackFinished(lastPosition, previousTrack.duration)) {
		await reportPlaybackCompleted(previousTrack)
	} else if (previousTrack) {
		await reportPlaybackStopped(previousTrack, lastPosition)
	}

	// Then we can update the store...
	usePlayerQueueStore.setState((state) => ({
		...state,
		currentIndex,
		queue: actualQueue,
	}))

	// ...report that playback has started for the new track...
	await reportPlaybackStarted(actualQueue[currentIndex], 0)

	// TODO: Fix audio normalization logic against nitro player
	const { enableAudioNormalization } = usePlayerSettingsStore.getState()

	// ...and apply audio normalization if enabled in settings
	if (enableAudioNormalization) {
		const volume = calculateTrackVolume(actualQueue[currentIndex])
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

	await reportPlaybackProgress(currentTrack, position)

	const { autoDownload } = useUsageSettingsStore.getState()

	if (position / totalDuration > 0.3 && currentTrack && autoDownload) {
		const isDownloadedOrDownloadPending =
			(await DownloadManager.isTrackDownloaded(currentTrack?.id ?? '')) ||
			(await DownloadManager.isDownloading(currentTrack?.id ?? ''))

		if (isDownloadedOrDownloadPending) return
		try {
			await DownloadManager.downloadTrack(currentTrack)
		} catch (error) {
			console.warn('Error auto-downloading track:', error)
		}
	}
}

export async function onPlaybackStateChange(state: TrackPlayerState, reason: Reason | undefined) {
	const { queue, currentIndex } = usePlayerQueueStore.getState()
	const currentTrack = currentIndex !== undefined ? queue[currentIndex] : undefined
	const position = usePlayerPlaybackStore.getState().position

	if (!currentTrack || reason === 'skip') return

	if (['paused', 'stopped'].includes(state)) {
		if (isPlaybackFinished(position, currentTrack.duration)) {
			await reportPlaybackCompleted(currentTrack)
		} else {
			await reportPlaybackStopped(currentTrack, position)
		}
	} else if (state === 'playing') {
		await reportPlaybackStarted(currentTrack, position)
	}
}
