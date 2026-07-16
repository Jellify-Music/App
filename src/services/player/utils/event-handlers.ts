import reportPlaybackProgress from '../../../api/mutations/playback/functions/playback-progress'
import reportPlaybackStarted from '../../../api/mutations/playback/functions/playback-started'
import { usePlayerPlaybackStore } from '../../../stores/player/playback'
import { usePlayerQueueStore } from '../../../stores/player/queue'
import { TrackPlayer, Reason, TrackPlayerState, TrackItem } from 'react-native-nitro-player'
import handleAutoDownload from './auto-download'
import applyAudioNormalizationIfEnabled from '../../../utils/audio/normalization'
import { captureError } from '../../../utils/logging'
import LoggingContext from '../../../utils/logging/enums'
import { updateTrackMediaInfo } from './track-media-info'

/**
 * Tracks the most recent playback state so that resume-from-pause can be
 * distinguished from a genuine first-play, and so that onSeek can include
 * the correct IsPaused value in the progress report.
 */
let currentPlaybackState: TrackPlayerState | null = null

/** Tracks the last second we processed to avoid redundant logic on sub-second ticks. */
let lastProcessedPosition = -1

/** Tracks the last floor-rounded position (seconds) that was reported, to avoid duplicate periodic reports. */
let lastPeriodicReportPosition = -1

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

	const updatedIndex = queue.findIndex((t) => t.id === track.id)

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
	const flooredPosition = Math.floor(position)

	// Bail early if we are still within the same second
	if (flooredPosition === lastProcessedPosition) return

	lastProcessedPosition = flooredPosition

	const { queue, currentIndex } = usePlayerQueueStore.getState()
	const currentTrack = currentIndex !== undefined ? queue[currentIndex] : undefined

	if (!currentTrack) return

	usePlayerPlaybackStore.setState({
		position: flooredPosition,
	})

	// Report playback progress every 10 seconds
	if (flooredPosition % 10 === 0 && flooredPosition !== lastPeriodicReportPosition) {
		lastPeriodicReportPosition = flooredPosition
		reportPlaybackProgress(currentTrack, flooredPosition, currentPlaybackState === 'paused')
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
	lastPeriodicReportPosition = flooredPosition
}
