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
} from './event-handlers'
import navigationRef from '../../../screens/navigation'
import { captureError } from '../../../utils/logging'
import LoggingContext from '../../../utils/logging/enums'
import {
	useStreamingDeviceProfileStore,
	useDownloadingDeviceProfileStore,
} from '../../../stores/device-profile'
import { usePlayerSettingsStore } from '../../../stores/settings/player'
import { useUsageSettingsStore } from '../../../stores/settings/usage'
import { getDeviceProfile } from '../../../utils/audio/device-profiles'
import { updateTrackMediaInfo } from './track-media-info'

/**
 * Re-derives device profiles from the persisted quality settings on startup.
 * This ensures the profiles reflect the current filtering logic even if the
 * app was updated since the profiles were last persisted to MMKV.
 */
export function syncDeviceProfiles() {
	const streamingQuality = usePlayerSettingsStore.getState().streamingQuality
	const downloadQuality = useUsageSettingsStore.getState().downloadQuality

	useStreamingDeviceProfileStore
		.getState()
		.setDeviceProfile(getDeviceProfile(streamingQuality, 'stream'))

	useDownloadingDeviceProfileStore
		.getState()
		.setDeviceProfile(getDeviceProfile(downloadQuality, 'download'))
}

export function registerPlayerEventHandlers() {
	TrackPlayer.onTracksNeedUpdate(onTracksNeedUpdate)

	TrackPlayer.onChangeTrack(onChangeTrack)

	TrackPlayer.onPlaybackProgressChange(onPlaybackProgress)

	TrackPlayer.onPlaybackStateChange(onPlaybackStateChange)

	TrackPlayer.onSeek(onSeek)

	TrackPlayer.appStartedWithNotification((track) => {
		console.debug(`App started with notification`)
		navigationRef.navigate('PlayerRoot', {
			screen: 'PlayerScreen',
		})
	})
}

let restoring: Promise<void> | undefined

// Startup and Android Auto's resume request can overlap; both share one restore
export function restoreFromStorage() {
	restoring ??= restore().finally(() => (restoring = undefined))
	return restoring
}

async function restore() {
	const {
		queue: persistedQueue,
		currentIndex: persistedIndex,
		repeatMode,
	} = usePlayerQueueStore.getState()

	const savedPosition = usePlayerPlaybackStore.getState().position

	const storedPlayQueue = persistedQueue.length > 0 ? persistedQueue : undefined

	// Started from the car before JS was running: keep that queue instead of the persisted one
	const carQueue = !!(await TrackPlayer.getState()).currentTrack

	if (
		!carQueue &&
		Array.isArray(storedPlayQueue) &&
		storedPlayQueue.length > 0 &&
		!isUndefined(persistedIndex) &&
		persistedIndex !== null
	) {
		// Create player playlist from stored queue
		const playlistId = await PlayerQueue.createPlaylist('Restored Playlist')

		await PlayerQueue.addTracksToPlaylist(playlistId, storedPlayQueue)

		// The car may have picked a song while this playlist was being built
		if ((await TrackPlayer.getState()).currentTrack) {
			await PlayerQueue.deletePlaylist(playlistId)
			return TrackPlayer.setRepeatMode(repeatMode ?? 'off')
		}

		// Load playlist and set current track
		await PlayerQueue.loadPlaylist(playlistId, persistedIndex)

		await TrackPlayer.seek(savedPosition)

		try {
			const tracksNeedingUrls = await TrackPlayer.getTracksNeedingUrls()
			if (tracksNeedingUrls.length > 0) {
				await updateTrackMediaInfo(tracksNeedingUrls)
			}
		} catch (error) {
			captureError(
				error,
				LoggingContext.Initialization,
				'Error restoring track media info during initialization',
			)
		}
	}

	try {
		const restoredRepeatMode = repeatMode ?? 'off'
		TrackPlayer.setRepeatMode(restoredRepeatMode)

		// Restore saved playback position after queue is loaded
		if (!carQueue && savedPosition > 0) {
			try {
				await TrackPlayer.seek(savedPosition)
				console.log('Restored playback position:', savedPosition)
			} catch (error) {
				captureError(
					error,
					LoggingContext.Initialization,
					'Failed to restore playback position',
				)
			}
		}
	} catch (error) {
		captureError(error, LoggingContext.Initialization, 'Error restoring player state')
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
