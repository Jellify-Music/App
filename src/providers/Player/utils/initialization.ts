import { isUndefined } from 'lodash'
import { TrackPlayer, PlayerQueue } from 'react-native-nitro-player'
import { usePlayerQueueStore } from '../../../stores/player/queue'
import { usePlayerPlaybackStore } from '../../../stores/player/playback'
import {
	onChangeTrack,
	onPlaybackProgress,
	onPlaybackStateChange,
	onTracksNeedUpdate,
} from './event-handlers'

export default function Initialize() {
	restoreFromStorage()

	registerEventHandlers()
}

function registerEventHandlers() {
	TrackPlayer.onTracksNeedUpdate(onTracksNeedUpdate)

	TrackPlayer.onChangeTrack(onChangeTrack)

	TrackPlayer.onPlaybackProgressChange(onPlaybackProgress)

	TrackPlayer.onPlaybackStateChange(onPlaybackStateChange)
}

function restoreFromStorage() {
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
