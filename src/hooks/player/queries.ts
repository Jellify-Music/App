import usePlayerEngineStore from '../../stores/player/engine'
import { PlayerEngine } from '../../stores/player/engine'
import { MediaPlayerState, useRemoteMediaClient, useStreamPosition } from 'react-native-google-cast'
import { useEffect, useState } from 'react'
import {
	TrackPlayerState,
	useOnPlaybackProgressChange,
	useOnPlaybackStateChange,
} from 'react-native-nitro-player'

export const useProgress = () => {
	const { position, totalDuration } = useOnPlaybackProgressChange()

	const playerEngineData = usePlayerEngineStore((state) => state.playerEngineData)

	const isCasting = playerEngineData === PlayerEngine.GOOGLE_CAST
	const streamPosition = useStreamPosition()
	if (isCasting) {
		return {
			position: streamPosition || 0,
			totalDuration: totalDuration || 0,
		}
	}

	return {
		position,
		totalDuration,
	}
}

const castToRNTPState = (state: MediaPlayerState): TrackPlayerState => {
	switch (state) {
		case MediaPlayerState.PLAYING:
			return 'playing'
		case MediaPlayerState.PAUSED:
			return 'paused'
		case MediaPlayerState.BUFFERING:
			return 'paused'
		case MediaPlayerState.IDLE:
			return 'paused'
		case MediaPlayerState.LOADING:
			return 'paused'
		default:
			return 'stopped'
	}
}

export const usePlaybackState = (): TrackPlayerState | undefined => {
	const { state } = useOnPlaybackStateChange()

	const playerEngineData = usePlayerEngineStore((state) => state.playerEngineData)

	const client = useRemoteMediaClient()

	const isCasting = playerEngineData === PlayerEngine.GOOGLE_CAST
	const [playbackState, setPlaybackState] = useState<TrackPlayerState | undefined>(state)

	useEffect(() => {
		let unsubscribe: (() => void) | undefined

		if (client && isCasting) {
			const handler = (status: { playerState?: MediaPlayerState | null } | null) => {
				if (status?.playerState) {
					setPlaybackState(castToRNTPState(status.playerState))
				}
			}

			const maybeUnsubscribe = client.onMediaStatusUpdated(handler)
			// EmitterSubscription has a remove() method, wrap it as a function
			if (
				maybeUnsubscribe &&
				typeof maybeUnsubscribe === 'object' &&
				'remove' in maybeUnsubscribe
			) {
				const subscription = maybeUnsubscribe as { remove: () => void }
				unsubscribe = () => subscription.remove()
			}
		} else {
			setPlaybackState(state)
		}

		return () => {
			if (unsubscribe) unsubscribe()
		}
	}, [client, isCasting, state])

	return playbackState
}
