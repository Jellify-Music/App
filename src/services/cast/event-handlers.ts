import reportPlaybackCompleted from '../../api/mutations/playback/functions/playback-completed'
import reportPlaybackProgress from '../../api/mutations/playback/functions/playback-progress'
import reportPlaybackStarted from '../../api/mutations/playback/functions/playback-started'
import { usePlayerQueueStore } from '../../stores/player/queue'
import { PlayerEngine } from '../../enums/player-engine'
import usePlayerEngineStore from '../../stores/player/engine'
import { CastSession, CastState, MediaStatus } from 'react-native-google-cast'

export function onCastStateChanged(state: CastState): void {
	const { setPlayerEngine } = usePlayerEngineStore.getState()

	switch (state) {
		case CastState.CONNECTED:
			return setPlayerEngine(PlayerEngine.GOOGLE_CAST)
		default:
			return setPlayerEngine(PlayerEngine.NITRO_PLAYER)
	}
}

// TODO: Load the current queue into the Cast session
export function onSessionStarted(session: CastSession): void {}

/**
 * An event handler for the {@link RemoteMediaClient.onMediaPlaybackStarted} event.
 *
 * @param mediaStatus The {@link MediaStatus} or null of the {@link RemoteMediaClient}
 * @returns
 */
export function onMediaPlaybackStarted(mediaStatus: MediaStatus | null): void {
	const { queue, currentIndex } = usePlayerQueueStore.getState()

	const currentTrack = currentIndex !== undefined ? queue[currentIndex] : undefined

	if (!currentTrack) return

	reportPlaybackStarted(currentTrack, mediaStatus?.streamPosition)
}

/**
 * An event handler for the {@link RemoteMediaClient.onMediaProgressUpdate} event.
 *
 * @param progress The stream progress of the {@link RemoteMediaClient}
 * @param duration The duration of the currently playing track
 */
export function onMediaProgressUpdated(progress: number, duration: number): void {
	const { queue, currentIndex } = usePlayerQueueStore.getState()

	const currentTrack = currentIndex !== undefined ? queue[currentIndex] : undefined

	if (!currentTrack) return

	reportPlaybackProgress(currentTrack, progress)
}

/**
 * An event handler for the {@link RemoteMediaClient.onMediaPlaybackEnded} event.
 *
 * Reports playback as completed if there is a current track in the {@link usePlayerQueueStore}.
 *
 * @param mediaStatus The {@link MediaStatus} or null of the {@link RemoteMediaClient}
 * @returns
 */
export function onMediaPlaybackEnded(mediaStatus: MediaStatus | null): void {
	const { queue, currentIndex } = usePlayerQueueStore.getState()

	const currentTrack = currentIndex !== undefined ? queue[currentIndex] : undefined

	if (!currentTrack) return

	reportPlaybackCompleted(currentTrack)
}
