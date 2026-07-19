// Google Cast (react-native-google-cast) removed — casting is handled natively by
// react-native-nitro-player. These handlers fed the RNGC remote-media-client
// events; nitro-player now drives playback (and reporting) through the normal
// TrackPlayer event path, so they are no longer wired up.

// import reportPlaybackCompleted from '../../api/mutations/playback/functions/playback-completed'
// import reportPlaybackProgress from '../../api/mutations/playback/functions/playback-progress'
// import reportPlaybackStarted from '../../api/mutations/playback/functions/playback-started'
// import { usePlayerQueueStore } from '../../stores/player/queue'
// import { PlayerEngine } from '../../enums/player-engine'
// import usePlayerEngineStore from '../../stores/player/engine'
// import { CastSession, CastState, MediaStatus } from 'react-native-google-cast'

// export function onCastStateChanged(state: CastState): void {
// 	const { setPlayerEngine } = usePlayerEngineStore.getState()
// 	switch (state) {
// 		case CastState.CONNECTED:
// 			return setPlayerEngine(PlayerEngine.GOOGLE_CAST)
// 		default:
// 			return setPlayerEngine(PlayerEngine.NITRO_PLAYER)
// 	}
// }

// export function onSessionStarted(session: CastSession): void {}

// export function onMediaPlaybackStarted(mediaStatus: MediaStatus | null): void {
// 	const { queue, currentIndex } = usePlayerQueueStore.getState()
// 	const currentTrack = currentIndex !== undefined ? queue[currentIndex] : undefined
// 	if (!currentTrack) return
// 	reportPlaybackStarted(currentTrack, mediaStatus?.streamPosition)
// }

// export function onMediaProgressUpdated(progress: number, duration: number): void {
// 	const { queue, currentIndex } = usePlayerQueueStore.getState()
// 	const currentTrack = currentIndex !== undefined ? queue[currentIndex] : undefined
// 	if (!currentTrack) return
// 	reportPlaybackProgress(currentTrack, progress)
// }

// export function onMediaPlaybackEnded(mediaStatus: MediaStatus | null): void {
// 	const { queue, currentIndex } = usePlayerQueueStore.getState()
// 	const currentTrack = currentIndex !== undefined ? queue[currentIndex] : undefined
// 	if (!currentTrack) return
// 	reportPlaybackCompleted(currentTrack)
// }

export {}
