// Google Cast removed — casting is handled natively by nitro-player, whose
// playback-state events already reflect remote playback while casting.
// import { useEffect, useState } from 'react'
// import { usePlayerEngine } from '../../stores/player/engine'
// import { PlayerEngine } from '../../enums/player-engine'
// import { MediaPlayerState, useRemoteMediaClient } from 'react-native-google-cast'
import { TrackPlayerState, useOnPlaybackStateChange } from 'react-native-nitro-player'
import { usePlaybackPosition } from '../../stores/player/playback'
import { useCurrentTrack } from '../../stores/player/queue'

interface UseProgressResult {
	position: number
	totalDuration: number
}

export const useProgress = (): UseProgressResult => {
	const position = usePlaybackPosition()
	const totalDuration = useCurrentTrack()?.duration || 0

	return {
		position,
		totalDuration,
	}
}

// --- Google Cast remote-client → player-state mapping (commented out) ---
// const castToPlayerState = (state: MediaPlayerState): TrackPlayerState => {
// 	switch (state) {
// 		case MediaPlayerState.PLAYING:
// 			return 'playing'
// 		case MediaPlayerState.PAUSED:
// 			return 'paused'
// 		default:
// 			return 'stopped'
// 	}
// }

export const usePlaybackState = (): TrackPlayerState | undefined => {
	const { state } = useOnPlaybackStateChange()

	// nitro-player emits the remote player's state while casting, so no special
	// Google Cast handling is needed here anymore.
	return state
}
