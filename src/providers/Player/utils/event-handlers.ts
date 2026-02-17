import reportPlaybackCompleted from '../../../api/mutations/playback/functions/playback-completed'
import reportPlaybackProgress from '../../../api/mutations/playback/functions/playback-progress'
import reportPlaybackStarted from '../../../api/mutations/playback/functions/playback-started'
import reportPlaybackStopped from '../../../api/mutations/playback/functions/playback-stopped'
import isPlaybackFinished from '../../../api/mutations/playback/utils'
import { refetchDownloadsAfterDelay } from '../../../hooks/downloads/utils'
import { usePlayerPlaybackStore, setPlaybackPosition } from '../../../stores/player/playback'
import { usePlayerQueueStore } from '../../../stores/player/queue'
import { usePlayerSettingsStore } from '../../../stores/settings/player'
import { useUsageSettingsStore } from '../../../stores/settings/usage'
import calculateTrackVolume from '../../../utils/audio/normalization'
import {
	TrackPlayer,
	DownloadManager,
	TrackItem,
	Reason,
	TrackPlayerState,
} from 'react-native-nitro-player'

export async function onChangeTrack(reason: Reason | undefined) {
	const { isQueuing } = usePlayerQueueStore.getState()

	// If we're in the middle of queuing a new playlist, we can skip reporting playback changes
	if (isQueuing) {
		console.info('Skipping playback reporting due to ongoing queue change')
		return
	}

	const { currentIndex, currentTrack } = await TrackPlayer.getState()

	// Get the last track and the last known position...
	const previousTrack = usePlayerQueueStore.getState().currentTrack
	const lastPosition = usePlayerPlaybackStore.getState().position

	// ...report that playback has stopped for the previous track, including the last position
	if (previousTrack && isPlaybackFinished(lastPosition, previousTrack.duration)) {
		await reportPlaybackCompleted(previousTrack)
	} else if (previousTrack) {
		await reportPlaybackStopped(previousTrack, lastPosition)
	}

	// Then we can update the store...
	usePlayerQueueStore.getState().setCurrentIndex(currentIndex)
	usePlayerQueueStore.getState().setCurrentTrack(currentTrack!)

	// ...report that playback has started for the new track...
	await reportPlaybackStarted(currentTrack!, 0)

	const { enableAudioNormalization } = usePlayerSettingsStore.getState()

	// ...and apply audio normalization if enabled in settings
	if (enableAudioNormalization) {
		const volume = calculateTrackVolume(currentTrack!)
		TrackPlayer.setVolume(volume)
	}
}

export async function onPlaybackProgress(position: number, totalDuration: number) {
	setPlaybackPosition(position)

	const { currentTrack } = usePlayerQueueStore.getState()

	if (!currentTrack) return

	await reportPlaybackProgress(currentTrack, position)

	const { autoDownload } = useUsageSettingsStore.getState()

	const isDownloadedOrDownloadPending =
		(await DownloadManager.isTrackDownloaded(currentTrack?.id ?? '')) ||
		(await DownloadManager.isDownloading(currentTrack?.id ?? ''))

	if (
		position / totalDuration > 0.3 &&
		currentTrack &&
		autoDownload &&
		!isDownloadedOrDownloadPending
	) {
		try {
			await DownloadManager.downloadTrack(currentTrack)

			refetchDownloadsAfterDelay()
		} catch (error) {
			console.warn('Error auto-downloading track:', error)
		}
	}
}

export async function onPlaybackStateChange(state: TrackPlayerState, reason: Reason | undefined) {
	const currentTrack = usePlayerQueueStore.getState().currentTrack
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
