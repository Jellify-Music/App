import TrackPlayer, { Event } from 'react-native-track-player'
import { SKIP_TO_PREVIOUS_THRESHOLD } from '../configs/player.config'
import { CarPlay } from 'react-native-carplay'

/**
 * Jellify Playback Service.
 *
 * Sets up event listeners for remote control events and
 * runs for the duration of the app lifecycle
 */
export async function PlaybackService() {
	TrackPlayer.addEventListener(Event.RemotePlay, async () => {
		await TrackPlayer.play()
	})
	TrackPlayer.addEventListener(Event.RemotePause, async () => {
		await TrackPlayer.pause()
	})

	TrackPlayer.addEventListener(Event.RemoteNext, async () => {
		await TrackPlayer.skipToNext()
	})

	TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
		const progress = await TrackPlayer.getProgress()

		if (progress.position < SKIP_TO_PREVIOUS_THRESHOLD) await TrackPlayer.skipToPrevious()
		else await TrackPlayer.seekTo(0)
	})

	TrackPlayer.addEventListener(Event.RemoteSeek, async (event) => {
		await TrackPlayer.seekTo(event.position)
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
