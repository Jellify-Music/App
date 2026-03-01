import { isUndefined } from 'lodash'
import { TrackPlayer, PlayerQueue } from 'react-native-nitro-player'
import { clearQueueStore, setIsQueuing, usePlayerQueueStore } from '../../../stores/player/queue'
import { usePlayerPlaybackStore } from '../../../stores/player/playback'
import {
	onChangeTrack,
	onPlaybackProgress,
	onPlaybackStateChange,
	onTracksNeedUpdate,
	resolveTrackUrls,
} from './event-handlers'
import useJellifyStore from '../../../stores'

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
	const migratedToNitroPlayer = useJellifyStore.getState().migratedToNitroPlayer

	// If we haven't migrated to nitro player yet, we need to clear the persisted queue
	// This is because the Track objects in the persisted queue are not compatible with
	// nitro player and will cause errors in the UI if we try to load them
	if (!migratedToNitroPlayer) {
		clearPersistedQueue()
		return
	}

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

		PlayerQueue.addTracksToPlaylist(playlistId, storedPlayQueue, 0)

		// Load playlist and set current track
		PlayerQueue.loadPlaylist(playlistId)

		TrackPlayer.skipToIndex(persistedIndex)

		TrackPlayer.seek(savedPosition)
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

/**
 * Clears the persisted queue and resets the player state.
 *
 * This is needed for cases where the persisted queue is
 * incompatible with the current player implementation
 *
 * @since 1.1.0
 */
function clearPersistedQueue() {
	clearQueueStore()

	usePlayerPlaybackStore.getState().setPosition(0)

	// Mark that we've migrated to nitro player so we don't clear the queue on every app launch
	useJellifyStore.getState().setMigratedToNitroPlayer(true)
}
