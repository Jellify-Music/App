import reportPlaybackProgress from '../../../api/mutations/playback/functions/playback-progress'
import { usePlayerPlaybackStore } from '../../../stores/player/playback'
import { setNewQueue, usePlayerQueueStore } from '../../../stores/player/queue'
import {
	TrackPlayer,
	Reason,
	TrackPlayerState,
	TrackItem,
	PlayerQueue,
} from 'react-native-nitro-player'
import handleAutoDownload from './auto-download'
import applyAudioNormalizationIfEnabled from '../../../utils/audio/normalization'
import { captureError } from '../../../utils/logging'
import LoggingContext from '../../../utils/logging/enums'
import { updateTrackMediaInfo } from './track-media-info'
import reportPlaybackCompleted from '../../../api/mutations/playback/functions/playback-completed'
import { AppState, Platform } from 'react-native'
import reportPlaybackStarted from '../../../api/mutations/playback/functions/playback-started'
import { AA_PLAYLIST_NAME_PREFIX } from '../../android-auto/tree'

/**
 * Tracks the most recent playback state so that resume-from-pause can be
 * distinguished from a genuine first-play, and so that onSeek can include
 * the correct IsPaused value in the progress report.
 */
let currentPlaybackState: TrackPlayerState | null = null

/** Tracks the last second we processed to avoid redundant logic on sub-second ticks. */
let lastProcessedPosition = -1

/**
 * Tracks whether we've reported this track as completed / listened to Jellyfin
 */
let trackMarkedAsListened = false

/**
 * An event handler for the {@link TrackPlayer.onTracksNeedUpdate} event.
 * This is called by the player when it determines that one or more tracks
 * in the queue need updated media info (e.g. empty URLs).
 *
 * The player provides the list of tracks that need updating, and this handler
 * fetches fresh media info for those tracks and updates the player and queue
 * store accordingly.
 *
 * @param tracks The {@link TrackItem}s that need URLs
 * @param lookahead The number of tracks ahead for which the player is requesting updated info.
 */
export async function onTracksNeedUpdate(tracks: TrackItem[], lookahead: number) {
	if (tracks.length === 0) return

	console.debug(
		`[Player Event] onTracksNeedUpdate triggered for ${tracks.length} track(s). Updating media info...`,
	)

	const tracksToUpdate = lookahead > 0 ? tracks.slice(0, lookahead) : tracks

	console.debug(`[Player Event] Updating media info for track lookahead ${tracksToUpdate.length}`)

	await updateTrackMediaInfo(tracksToUpdate)
}

/**
 * An event handler for the {@link TrackPlayer.onChangeTrack} event.
 * This is called by the player when the currently playing track changes
 * over to a new one.
 *
 * Updates the `currentIndex` in the {@link usePLayerQueueStore}, which will
 * update the track being displayed in the player via Zustand.
 *
 * Also reports that playback has either stopped or completed for the previous
 * track, depending on if the user listened past the detection threshold (80%)
 *
 * @param track The {@link TrackItem} the currently playing track
 * @param _reason The {@link Reason} for the track changing
 */
export async function onChangeTrack(track: TrackItem, reason?: Reason) {
	// Grab snapshot of the previous track and playback position for reporting
	const { queue, currentIndex: prevIndex } = usePlayerQueueStore.getState()

	trackMarkedAsListened = false

	let updatedIndex = queue.findIndex((t) => t.id === track.id)

	// Playback started outside the JS queue (Android Auto picked a native playlist):
	// adopt that playlist so the phone player shows the right queue and track. An Android
	// Auto playlist is adopted even when the track also sits in the JS queue, unless the
	// JS queue already mirrors it.
	const playlistId = PlayerQueue.getCurrentPlaylistId()
	const playlist = playlistId ? PlayerQueue.getPlaylist(playlistId) : null
	const isUnadoptedAaPlaylist =
		!!playlist?.name.startsWith(AA_PLAYLIST_NAME_PREFIX) &&
		(playlist.tracks.length !== queue.length ||
			playlist.tracks.some((t, i) => t.id !== queue[i].id))

	if (playlist && (updatedIndex === -1 || isUnadoptedAaPlaylist)) {
		const adoptedIndex = adoptNativePlaylist(track, playlist)
		if (adoptedIndex !== -1) updatedIndex = adoptedIndex
	}

	// Update the store immediately so the UI reflects the new track without waiting for network
	usePlayerQueueStore.setState((state) => ({
		...state,
		currentIndex: updatedIndex !== -1 ? updatedIndex : prevIndex,
	}))

	/**
	 * Apply audio normalization if enabled in the settings, otherwise reset to default volume (100).
	 */
	await applyAudioNormalizationIfEnabled(track)

	reportPlaybackStarted(track)
}

/**
 * Adopts the native {@link PlayerQueue} playlist that is currently playing as the JS
 * queue. This happens when playback was started outside of the phone UI (e.g. Android
 * Auto picked a native playlist directly), so the JS queue store doesn't yet know about
 * the tracks the car is playing.
 *
 * @param track The {@link TrackItem} that is now playing
 * @param playlist The currently playing native playlist
 * @returns The index of `track` within the adopted playlist, or -1 if it could not be found
 */
function adoptNativePlaylist(
	track: TrackItem,
	playlist: { name: string; tracks: TrackItem[] },
): number {
	const index = playlist.tracks.findIndex((t) => t.id === track.id)
	if (index === -1) return -1

	const label = playlist.name.startsWith(AA_PLAYLIST_NAME_PREFIX)
		? playlist.name.slice(AA_PLAYLIST_NAME_PREFIX.length)
		: playlist.name

	usePlayerQueueStore.getState().setUnshuffledQueue(playlist.tracks)
	setNewQueue(playlist.tracks, label, index, false)
	return index
}

/**
 * An event handler for the {@link TrackPlayer.onPlaybackProgress} event.
 * This is called by the {@link TrackPlayer} each second of playback.
 *
 * Always updates the `position` in the {@link usePlayerPlaybackStore} to
 * update the progress components via Zustand.
 *
 * Reports playback progress back to Jellyfin every 10 seconds of playback.
 *
 * Triggers an automatic download of the currently playing song after 30% playback.
 *
 * @param position The current position in seconds of the {@link TrackPlayer}
 * @param totalDuration The total duration of the currently playing {@link TrackItem} in seconds
 */
export async function onPlaybackProgress(position: number, totalDuration: number) {
	// Bail early if we are still within the same second
	if (position === lastProcessedPosition) return

	lastProcessedPosition = position

	const { queue, currentIndex } = usePlayerQueueStore.getState()
	const currentTrack = currentIndex !== undefined ? queue[currentIndex] : undefined

	if (!currentTrack) return

	usePlayerPlaybackStore.setState({
		position,
	})

	// Mark the track as completed if 2/3s of the track has been completed
	if (position > (totalDuration / 3) * 2 && !trackMarkedAsListened) {
		reportPlaybackCompleted(currentTrack)
		trackMarkedAsListened = true
	}

	handleAutoDownload(position, totalDuration, currentTrack).catch((error) => {
		captureError(
			error,
			LoggingContext.AutoDownload,
			`Error in auto-download logic during playback progress. Position: ${position}, Total Duration: ${totalDuration}, Track ID: ${currentTrack.id}`,
		)
	})
}

/**
 * An event handler for the {@link TrackPlayer.onPlaybackStateChange} event.
 *
 * @param state The updated {@link TrackPlayerState}
 * @param reason The {@link Reason} or `undefined` as to why the playback state changed.
 * @returns
 */
export function onPlaybackStateChange(state: TrackPlayerState, reason: Reason | undefined) {
	const { queue, currentIndex } = usePlayerQueueStore.getState()
	const currentTrack = currentIndex !== undefined ? queue[currentIndex] : undefined
	const { position } = usePlayerPlaybackStore.getState()

	const prevState = currentPlaybackState
	currentPlaybackState = state

	if (!currentTrack || reason === 'skip') return

	switch (state) {
		case 'playing': {
			// Report playback progress if we're continuing from a pause
			if (prevState === 'paused') {
				reportPlaybackProgress(currentTrack, position, false)
			}
			break
		}
		default: {
			// Report playback progress if we're pausing
			if (prevState === 'playing') {
				reportPlaybackProgress(currentTrack, position, true)
			}
			break
		}
	}
}

/**
 * An event handler for the {@link TrackPlayer.onSeek} event.
 *
 * @param position The new position of the {@link TrackPlayer}
 * @returns
 */
export function onSeek(position: number) {
	const flooredPosition = Math.floor(position)

	usePlayerPlaybackStore.setState({
		position: flooredPosition,
	})

	const { queue, currentIndex } = usePlayerQueueStore.getState()
	const currentTrack = currentIndex !== undefined ? queue[currentIndex] : undefined

	if (!currentTrack) return

	reportPlaybackProgress(currentTrack, flooredPosition, currentPlaybackState === 'paused')
}
