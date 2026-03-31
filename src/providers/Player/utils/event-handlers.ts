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
 * Native callback — skipped while a queuing operation is in progress to
 * prevent races with the explicit resolveTrackUrls call in useLoadNewQueue.
 */
export async function onTracksNeedUpdate(tracks: TrackItem[], _lookahead: number) {
	const { isQueuing } = usePlayerQueueStore.getState()

	if (isQueuing) {
		console.info('onTracksNeedUpdate: skipping during queue load')
		return
	}

	if (tracks.length === 0) return

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

	reportPlaybackStarted(track, 0)

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
	usePlayerPlaybackStore.setState({
		position,
	})

	const { queue, currentIndex } = usePlayerQueueStore.getState()
	const currentTrack = currentIndex !== undefined ? queue[currentIndex] : undefined

	if (!currentTrack) return

	if (position % 10 === 0) reportPlaybackProgress(currentTrack, position)

	handleAutoDownload(position, totalDuration, currentTrack).catch((err) => {
		console.error('Error handling auto-download', err)
	})
}

export function onPlaybackStateChange(state: TrackPlayerState, reason: Reason | undefined) {
	const { queue, currentIndex } = usePlayerQueueStore.getState()
	const currentTrack = currentIndex !== undefined ? queue[currentIndex] : undefined
	const position = usePlayerPlaybackStore.getState().position

	if (!currentTrack || reason === 'skip') return

	if (['paused', 'stopped'].includes(state)) {
		if (isPlaybackFinished(position, currentTrack.duration)) {
			reportPlaybackCompleted(currentTrack)
		} else {
			reportPlaybackStopped(currentTrack, position)
		}
	} else if (state === 'playing') {
		reportPlaybackStarted(currentTrack, position)
	}
}

export function onSeek(position: number) {
	usePlayerPlaybackStore.setState({
		position,
	})

	const { queue, currentIndex } = usePlayerQueueStore.getState()
	const currentTrack = currentIndex !== undefined ? queue[currentIndex] : undefined

	if (!currentTrack) return

	reportPlaybackProgress(currentTrack, position)
}
