import { isUndefined } from 'lodash'
import { TrackPlayer, PlayerQueue, DownloadManager } from 'react-native-nitro-player'
import { usePlayerQueueStore } from '../../../stores/player/queue'
import reportPlaybackStarted from '../../../api/mutations/playback/functions/playback-started'
import { usePlayerSettingsStore } from '../../../stores/settings/player'
import calculateTrackVolume from '../../../utils/audio/normalization'
import { setPlaybackPosition, usePlayerPlaybackStore } from '../../../stores/player/playback'
import { useUsageSettingsStore } from '../../../stores/settings/usage'
import isPlaybackFinished from '../../../api/mutations/playback/utils'
import reportPlaybackCompleted from '../../../api/mutations/playback/functions/playback-completed'
import { refetchDownloadsAfterDelay } from '../../../hooks/downloads/utils'
import reportPlaybackStopped from '../../../api/mutations/playback/functions/playback-stopped'
import reportPlaybackProgress from '../../../api/mutations/playback/functions/playback-progress'

export default function Initialize() {
	restoreFromStorage()

	registerEventHandlers()
}

function registerEventHandlers() {
	TrackPlayer.onChangeTrack(async (track, reason) => {
		const { queuing } = usePlayerQueueStore.getState()

		// If we're in the middle of queuing a new playlist, we can skip reporting playback changes
		if (queuing) {
			console.info('Skipping playback reporting due to ongoing queue change')
			return
		}

		console.info(`Track changed because: ${reason}`)

		const { currentIndex } = await TrackPlayer.getState()

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
		usePlayerQueueStore.getState().setCurrentTrack(track)

		// ...report that playback has started for the new track...
		await reportPlaybackStarted(track, 0)

		const { enableAudioNormalization } = usePlayerSettingsStore.getState()

		// ...and apply audio normalization if enabled in settings
		if (enableAudioNormalization) {
			const volume = calculateTrackVolume(track)
			TrackPlayer.setVolume(volume)
		}
	})

	TrackPlayer.onPlaybackProgressChange(async (position, totalDuration) => {
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
	})

	TrackPlayer.onPlaybackStateChange(async (state, reason) => {
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
	})
}

async function restoreFromStorage() {
	const {
		queue: persistedQueue,
		currentIndex: persistedIndex,
		repeatMode,
	} = usePlayerQueueStore.getState()

	const savedPosition = usePlayerPlaybackStore.getState().position

	const storedPlayQueue = persistedQueue.length > 0 ? persistedQueue : undefined

	if (
		Array.isArray(storedPlayQueue) &&
		storedPlayQueue.length > 0 &&
		!isUndefined(persistedIndex) &&
		persistedIndex !== null
	) {
		// Create player playlist from stored queue
		const playlistId = PlayerQueue.createPlaylist('Restored Playlist')

		try {
			PlayerQueue.addTracksToPlaylist(playlistId, storedPlayQueue, 0)

			// Load playlist and set current track
			PlayerQueue.loadPlaylist(playlistId)

			TrackPlayer.skipToIndex(persistedIndex)
		} catch (error) {
			console.warn('Error restoring player queue:', error)
		}
	}

	try {
		const restoredRepeatMode = repeatMode ?? 'off'
		TrackPlayer.setRepeatMode(restoredRepeatMode)

		// Restore saved playback position after queue is loaded
		if (savedPosition > 0) {
			try {
				TrackPlayer.seek(savedPosition)
				console.log('Restored playback position:', savedPosition)
			} catch (error) {
				console.warn('Failed to restore playback position:', error)
			}
		}
	} catch (error) {
		console.warn('Error restoring player state:', error)
	}
}
