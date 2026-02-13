import { isUndefined } from 'lodash'
import { TrackPlayer, PlayerQueue } from 'react-native-nitro-player'
import { usePlayerQueueStore } from '../../../stores/player/queue'
import { handleActiveTrackChanged } from '../../../hooks/player/functions'
import JellifyTrack from '../../../types/JellifyTrack'
import reportPlaybackStarted from '../../../api/mutations/playback/functions/playback-started'
import { usePlayerSettingsStore } from '../../../stores/settings/player'
import calculateTrackVolume from '../../../hooks/player/functions/normalization'
import { setPlaybackPosition, usePlayerPlaybackStore } from '../../../stores/player/playback'

export default function Initialize() {
	restoreFromStorage()

	registerEventHandlers()
}

function registerEventHandlers() {
	TrackPlayer.onChangeTrack(async (track, reason) => {
		console.debug('Track changed:', reason)
		handleActiveTrackChanged(track, (await TrackPlayer.getState()).currentIndex)

		reportPlaybackStarted(track, 0)

		const enableAudioNormalization = usePlayerSettingsStore.getState().enableAudioNormalization

		if (enableAudioNormalization) {
			const volume = calculateTrackVolume(track as JellifyTrack)
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
