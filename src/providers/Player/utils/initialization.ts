import { isUndefined } from 'lodash'
import { TrackPlayer, PlayerQueue } from 'react-native-nitro-player'
import { usePlayerQueueStore } from '../../../stores/player/queue'
import { createMMKV } from 'react-native-mmkv'
import { handleActiveTrackChanged } from '../../../hooks/player/functions'
import JellifyTrack from '../../../types/JellifyTrack'
import reportPlaybackStarted from '../../../api/mutations/playback/functions/playback-started'
import { getApi } from '../../../stores'
import { usePlayerSettingsStore } from '../../../stores/settings/player'
import calculateTrackVolume from '../../../hooks/player/functions/normalization'

export default function Initialize() {
	restoreFromStorage()

	registerEventHandlers()
}

function registerEventHandlers() {
	const api = getApi()

	TrackPlayer.onChangeTrack((track, reason) => {
		handleActiveTrackChanged(track as JellifyTrack, TrackPlayer.getState().currentIndex)

		reportPlaybackStarted(api, track as JellifyTrack, 0)

		const enableAudioNormalization = usePlayerSettingsStore.getState().enableAudioNormalization

		if (enableAudioNormalization) {
			const volume = calculateTrackVolume(track as JellifyTrack)
			TrackPlayer.setVolume(volume)
		}
	})
}

function restoreFromStorage() {
	const {
		queue: persistedQueue,
		currentIndex: persistedIndex,
		repeatMode,
	} = usePlayerQueueStore.getState()

	// Read saved position BEFORE reset() to prevent it from being cleared
	const progressStorage = createMMKV({ id: 'progress_storage' })
	const savedPosition = progressStorage.getNumber('player-key') ?? 0
	console.log('savedPosition before reset', savedPosition)

	const storedPlayQueue = persistedQueue.length > 0 ? persistedQueue : undefined
	const storedIndex = persistedIndex

	if (
		Array.isArray(storedPlayQueue) &&
		storedPlayQueue.length > 0 &&
		!isUndefined(storedIndex) &&
		storedIndex !== null
	) {
		// Create player playlist from stored queue
		const playlistId = PlayerQueue.createPlaylist('Restored Playlist', 'test')

		console.debug(
			`Add Tracks to Playlist ID: ${playlistId}. Function: ${PlayerQueue.addTracksToPlaylist}. Tracks: ${storedPlayQueue.toString()}`,
		)

		try {
			PlayerQueue.addTracksToPlaylist(playlistId, storedPlayQueue, 0)

			// Load playlist and set current track
			PlayerQueue.loadPlaylist(playlistId)

			while (storedIndex > TrackPlayer.getState().currentIndex) TrackPlayer.skipToNext()

			usePlayerQueueStore.getState().setQueue(storedPlayQueue)
			usePlayerQueueStore.getState().setCurrentIndex(storedIndex)
			usePlayerQueueStore
				.getState()
				.setCurrentTrack(storedPlayQueue[storedIndex] ?? undefined)
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
