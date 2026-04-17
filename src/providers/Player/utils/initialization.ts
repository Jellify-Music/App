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
import { captureError } from '../../../utils/logging'

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
		setIsQueuing,
	} = usePlayerQueueStore.getState()

	const savedPosition = usePlayerPlaybackStore.getState().position

	const storedPlayQueue = persistedQueue.length > 0 ? persistedQueue : undefined

	if (
		Array.isArray(storedPlayQueue) &&
		storedPlayQueue.length > 0 &&
		!isUndefined(persistedIndex) &&
		persistedIndex !== null
	) {
		setIsQueuing(true)

		// Create player playlist from stored queue
		const playlistId = await PlayerQueue.createPlaylist('Restored Playlist')

		await PlayerQueue.addTracksToPlaylist(playlistId, storedPlayQueue, 0)

		// Load playlist and set current track
		await PlayerQueue.loadPlaylist(playlistId)

		TrackPlayer.skipToIndex(persistedIndex)

		TrackPlayer.seek(savedPosition)

		try {
			const tracksNeedingUrls = await TrackPlayer.getTracksNeedingUrls()
			if (tracksNeedingUrls.length > 0) {
				await updateTrackMediaInfo(tracksNeedingUrls)
			}
		} catch (error) {
			captureError(error, {
				message: 'Error restoring track media info during initialization',
			})
		}

		setIsQueuing(false)
	}

	try {
		const restoredRepeatMode = repeatMode ?? 'off'
		TrackPlayer.setRepeatMode(restoredRepeatMode)

		// Restore saved playback position after queue is loaded
		if (savedPosition > 0) {
			try {
				await TrackPlayer.seek(savedPosition)
				console.log('Restored playback position:', savedPosition)
			} catch (error) {
				captureError(error, { message: 'Failed to restore playback position' })
			}
		}
	} catch (error) {
		captureError(error, { message: 'Error restoring player state' })
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
