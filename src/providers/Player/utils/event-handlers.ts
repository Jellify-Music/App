import resolveTrackUrls from '../../../utils/fetching/track-media-info'
import reportPlaybackCompleted from '../../../api/mutations/playback/functions/playback-completed'
import reportPlaybackProgress from '../../../api/mutations/playback/functions/playback-progress'
import reportPlaybackStarted from '../../../api/mutations/playback/functions/playback-started'
import reportPlaybackStopped from '../../../api/mutations/playback/functions/playback-stopped'
import isPlaybackFinished from '../../../api/mutations/playback/utils'
import { usePlayerPlaybackStore } from '../../../stores/player/playback'
import { usePlayerQueueStore } from '../../../stores/player/queue'
import { usePlayerSettingsStore } from '../../../stores/settings/player'
import { resetPlayerVolume } from '../../../utils/audio/normalization'
import { TrackPlayer, Reason, TrackPlayerState, TrackItem } from 'react-native-nitro-player'
import handleAutoDownload from './auto-download'
import applyAudioNormalization from '../../../utils/audio/normalization'

/**
 * Tracks the most recent playback state so that resume-from-pause can be
 * distinguished from a genuine first-play, and so that onSeek can include
 * the correct IsPaused value in the progress report.
 */
let currentPlaybackState: TrackPlayerState | null = null

/** Tracks the last floor-rounded position (seconds) that was reported, to avoid duplicate periodic reports. */
let lastPeriodicReportPosition = -1

/**
 * Core URL-resolution logic. Fetches fresh playback info for each track,
 * builds updated track objects, calls TrackPlayer.updateTracks and syncs
 * the JS queue store. Has no guards — callers are responsible for gating.
 */
export async function updateTrackMediaInfo(tracks: TrackItem[]): Promise<TrackItem[]> {
	const updatedTracks = await resolveTrackUrls(tracks, 'stream')

	await TrackPlayer.updateTracks(updatedTracks)

	usePlayerQueueStore.setState((state) => ({
		...state,
		queue: state.queue.map((t) => {
			const updatedTrack = updatedTracks.find((ut) => ut.id === t.id)
			return updatedTrack ?? t
		}),
		unShuffledQueue: state.unShuffledQueue.map((t) => {
			const updatedTrack = updatedTracks.find((ut) => ut.id === t.id)
			return updatedTrack ?? t
		}),
	}))

	return updatedTracks
}

/**
 * An event handler for the {@link TrackPlayer.onTracksNeedUpdate} event.
 * This is called by the player when it determines that one or more tracks
 * in the queue need updated media info (e.g. empty URLs). The player
 * provides the list of tracks that need updating, and this handler fetches
 * fresh media info for those tracks and updates the player and queue store
 * accordingly.
 *
 * @param tracks The {@link TrackItem}s that need URLs
 * @param _lookahead Lookahead is not currently used in this function, but is provided by the player to indicate how many upcoming tracks should be resolved. We resolve all tracks here for simplicity, but this could be optimized in the future to only resolve a subset of tracks based on the lookahead value.
 * @returns
 */
export async function onTracksNeedUpdate(tracks: TrackItem[], _lookahead: number) {
	if (tracks.length === 0) return

	const { isQueuing } = usePlayerQueueStore.getState()

	if (isQueuing) {
		console.info('Skipping track update due to ongoing queue change')
		return
	}

	await updateTrackMediaInfo(tracks)
}

export async function onChangeTrack(track: TrackItem, _reason?: Reason) {
	// Grab snapshot of the previous track and playback position for reporting
	const { isQueuing, queue: prevQueue, currentIndex: prevIndex } = usePlayerQueueStore.getState()

	// If we're in the middle of queuing a new playlist, we can skip reporting playback changes
	if (isQueuing) {
		console.info('Skipping playback reporting due to ongoing queue change')
		return
	}

	const previousTrack = prevIndex !== undefined ? prevQueue[prevIndex] : undefined
	const lastPosition = usePlayerPlaybackStore.getState().position

	const updatedQueue = await TrackPlayer.getActualQueue()

	const updatedIndex = updatedQueue.findIndex((t) => t.id === track.id)

	// Update the store immediately so the UI reflects the new track without waiting for network
	usePlayerQueueStore.setState((state) => ({
		...state,
		queue: updatedQueue,
		currentIndex: updatedIndex !== -1 ? updatedIndex : prevIndex,
	}))

	if (previousTrack && isPlaybackFinished(lastPosition, previousTrack.duration)) {
		reportPlaybackCompleted(previousTrack)
	} else if (previousTrack) {
		reportPlaybackStopped(previousTrack, lastPosition)
	}

	/**
	 * Apply audio normalization if enabled in the settings, otherwise reset to default volume (100).
	 */
	const { enableAudioNormalization } = usePlayerSettingsStore.getState()
	if (enableAudioNormalization) {
		await applyAudioNormalization(track)
	} else {
		await resetPlayerVolume()
	}
}

export async function onPlaybackProgress(position: number, totalDuration: number) {
	const flooredPosition = Math.floor(position)

	usePlayerPlaybackStore.setState({
		position: flooredPosition,
	})

	const { queue, currentIndex } = usePlayerQueueStore.getState()
	const currentTrack = currentIndex !== undefined ? queue[currentIndex] : undefined

	if (!currentTrack) return

	if (flooredPosition % 10 === 0 && flooredPosition !== lastPeriodicReportPosition) {
		lastPeriodicReportPosition = flooredPosition
		reportPlaybackProgress(currentTrack, flooredPosition, currentPlaybackState === 'paused')
	}

	handleAutoDownload(position, totalDuration, currentTrack).catch((err) => {
		console.error('Error handling auto-download', err)
	})
}

export function onPlaybackStateChange(state: TrackPlayerState, reason: Reason | undefined) {
	const { queue, currentIndex } = usePlayerQueueStore.getState()
	const currentTrack = currentIndex !== undefined ? queue[currentIndex] : undefined
	const { position } = usePlayerPlaybackStore.getState()

	const prevState = currentPlaybackState
	currentPlaybackState = state

	if (!currentTrack || reason === 'skip') return

	if (state === 'paused') {
		reportPlaybackProgress(currentTrack, position, true)
	} else if (state === 'stopped') {
		if (isPlaybackFinished(position, currentTrack.duration)) {
			reportPlaybackCompleted(currentTrack)
		} else {
			reportPlaybackStopped(currentTrack, position)
		}
	} else if (state === 'playing') {
		if (prevState === 'paused') {
			// Resuming from pause — report progress (not a new start)
			reportPlaybackProgress(currentTrack, position, false)
		} else {
			reportPlaybackStarted(currentTrack, position)
		}
	}
}

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
