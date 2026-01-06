import TrackPlayer, { Event } from 'react-native-track-player'
import { CarPlay } from 'react-native-carplay'
import { previous, skip } from '../hooks/player/functions/controls'

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

	TrackPlayer.addEventListener(Event.RemoteNext, async () => skip(undefined))

	TrackPlayer.addEventListener(Event.RemotePrevious, previous)

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
