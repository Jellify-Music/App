import { TrackPlayerState, useOnPlaybackStateChange } from 'react-native-nitro-player'
import { usePlaybackPosition } from '../stores/player/playback'
import { useCurrentTrack } from '../stores/player/queue'

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

export const usePlaybackState = (): TrackPlayerState | undefined => {
	const { state } = useOnPlaybackStateChange()

	// nitro-player emits the remote player's state while casting, so no special
	// Google Cast handling is needed here anymore.
	return state
}
