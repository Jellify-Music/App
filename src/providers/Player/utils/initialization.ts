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

export default function Initialize() {
	restoreFromStorage()

	registerEventHandlers()
}

function registerEventHandlers() {
	TrackPlayer.onChangeTrack(async (track, reason) => {
		console.debug('Track changed:', reason)

		const { currentIndex } = await TrackPlayer.getState()

		// If the track was changed because the current track ended,
		// report playback for the track that just ended and automatically
		// download the track (if enabled in settings)
		if (reason && reason === 'end') {
			const previousTrack = usePlayerQueueStore.getState().queue[currentIndex - 1]
			const lastPosition = usePlayerPlaybackStore.getState().position

			if (previousTrack && isPlaybackFinished(lastPosition, previousTrack.duration)) {
				reportPlaybackCompleted(previousTrack)
			}

			const { autoDownload } = useUsageSettingsStore.getState()

			if (previousTrack && autoDownload) {
				DownloadManager.downloadTrack(previousTrack)
			}
		}

		// Then we can update the store...
		usePlayerQueueStore.getState().setCurrentIndex(currentIndex)
		usePlayerQueueStore.getState().setCurrentTrack(track)

		// ...report that playback has started for the new track...
		reportPlaybackStarted(track, 0)

		const { enableAudioNormalization } = usePlayerSettingsStore.getState()

		// ...and apply audio normalization if enabled in settings
		if (enableAudioNormalization) {
			const volume = calculateTrackVolume(track)
			TrackPlayer.setVolume(volume)
		}
	})

	TrackPlayer.onPlaybackProgressChange(async (position) => {
		setPlaybackPosition(position)
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
