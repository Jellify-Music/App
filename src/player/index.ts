import TrackPlayer, { Event } from 'react-native-track-player'
import { CarPlay } from 'react-native-carplay'
import { previous, skip } from '../hooks/player/functions/controls'
import { usePlayerQueueStore } from '../stores/player/queue'
import { optimizePlayerQueue } from './helpers/gapless'
import { PREFETCH_THRESHOLD_SECONDS } from '../configs/gapless.config'

/**
 * Jellify Playback Service.
 *
 * Sets up event listeners for remote control events and
 * runs for the duration of the app lifecycle.
 *
 * Also handles background queue optimization to ensure tracks
 * are buffered before they're needed (fixes iOS background playback).
 */
export async function PlaybackService() {
	TrackPlayer.addEventListener(Event.RemotePlay, async () => {
		await TrackPlayer.play()
	})
	TrackPlayer.addEventListener(Event.RemotePause, async () => {
		await TrackPlayer.pause()
	})

	TrackPlayer.addEventListener(Event.RemoteNext, async () => skip(undefined))

	TrackPlayer.addEventListener(Event.RemotePrevious, previous)

	TrackPlayer.addEventListener(Event.RemoteSeek, async (event) => {
		await TrackPlayer.seekTo(event.position)
	})

	/**
	 * Monitor playback progress to proactively buffer upcoming tracks.
	 * This runs even when the app is backgrounded, ensuring the next track
	 * is ready before the current one ends.
	 */
	TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, async (event) => {
		const { position, duration } = event

		if (!duration || duration <= 0) return

		const remainingSeconds = duration - position

		// When approaching the end of a track, ensure upcoming tracks are in the queue
		if (remainingSeconds <= PREFETCH_THRESHOLD_SECONDS && remainingSeconds > 0) {
			const queue = usePlayerQueueStore.getState().queue
			const currentIndex = usePlayerQueueStore.getState().currentIndex

			if (queue.length > 0 && currentIndex !== undefined) {
				await optimizePlayerQueue(queue, currentIndex)
			}
		}
	})

	/**
	 * Handle the case where the player queue ends unexpectedly.
	 * This can happen if iOS throttles network requests for backgrounded apps.
	 * When the app queue has more tracks, add them and resume playback.
	 */
	TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async () => {
		const queue = usePlayerQueueStore.getState().queue
		const currentIndex = usePlayerQueueStore.getState().currentIndex

		// If there are more tracks in the app queue that aren't in the player queue
		if (currentIndex !== undefined && currentIndex < queue.length - 1) {
			const remainingTracks = queue.slice(currentIndex + 1)

			if (remainingTracks.length > 0) {
				await TrackPlayer.add(remainingTracks)
				await TrackPlayer.play()
			}
		}
	})
}

export function registerAutoService(onConnect: () => void, onDisconnect: () => void) {
	CarPlay.registerOnConnect(onConnect)
	CarPlay.registerOnDisconnect(onDisconnect)

	return () => {
		CarPlay.unregisterOnConnect(onConnect)
		CarPlay.unregisterOnDisconnect(onDisconnect)
	}
}
