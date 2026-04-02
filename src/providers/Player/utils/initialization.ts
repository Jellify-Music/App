import { isUndefined } from 'lodash'
import { TrackPlayer, PlayerQueue } from 'react-native-nitro-player'
import { clearQueueStore, usePlayerQueueStore } from '../../../stores/player/queue'
import { usePlayerPlaybackStore } from '../../../stores/player/playback'
import {
	onChangeTrack,
	onPlaybackProgress,
	onPlaybackStateChange,
	onSeek,
	onTracksNeedUpdate,
	updateTrackMediaInfo,
} from './event-handlers'
import useJellifyStore from '../../../stores'
import { getAudioCache } from '../../../utils/legacy/offline-mode-utils'
import navigationRef from '../../../screens/navigation'

/**
 * Initializes the player by registering event handlers and restoring state from storage.
 * This function should be called once during app startup.
 */
export default function Initialize() {
	registerEventHandlers()

	restoreFromStorage()
}

function registerEventHandlers() {
	TrackPlayer.onTracksNeedUpdate(onTracksNeedUpdate)

	TrackPlayer.onChangeTrack(onChangeTrack)

	TrackPlayer.onPlaybackProgressChange(onPlaybackProgress)

	TrackPlayer.onPlaybackStateChange(onPlaybackStateChange)

	TrackPlayer.onSeek(onSeek)
}

async function restoreFromStorage() {
	const { migratedToNitroPlayer, setMigratedToNitroPlayer } = useJellifyStore.getState()

	// If we haven't migrated to nitro player yet, we need to clear the persisted queue
	// This is because the Track objects in the persisted queue are not compatible with
	// nitro player and will cause errors in the UI if we try to load them
	if (!migratedToNitroPlayer) {
		clearPersistedQueue()
		const audioCache = getAudioCache()

		if (audioCache.length > 0) {
			if (navigationRef.isReady()) {
				navigationRef.navigate('MigrateDownloads')
			} else {
				setTimeout(() => {
					navigationRef.navigate('MigrateDownloads')
				}, 1000)
			}
		}

		// Mark that we've migrated to nitro player so we don't clear the queue on every app launch
		return setMigratedToNitroPlayer(true)
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
		const playlistId = await PlayerQueue.createPlaylist('Restored Playlist')

		await PlayerQueue.addTracksToPlaylist(playlistId, storedPlayQueue, 0)

		// Load playlist and set current track
		await PlayerQueue.loadPlaylist(playlistId)

		TrackPlayer.skipToIndex(persistedIndex)

		TrackPlayer.seek(savedPosition)

		// Proactively resolve URLs for tracks that have empty/stale URLs after
		// restoration (same pattern as useLoadNewQueue). Without this the player
		// buffers endlessly on the first play attempt after an app restart.
		TrackPlayer.getTracksNeedingUrls()
			.then((tracksNeedingUrls) => {
				if (tracksNeedingUrls.length > 0) {
					return updateTrackMediaInfo(tracksNeedingUrls)
				}
			})
			.catch((error) => {
				console.warn('Failed to resolve URLs for restored queue:', error)
			})
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
}
