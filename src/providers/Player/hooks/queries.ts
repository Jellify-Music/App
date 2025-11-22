import {
	Progress,
	State,
	useProgress as useProgressRNTP,
	usePlaybackState as usePlaybackStateRNTP,
} from 'react-native-track-player'
import usePlayerEngineStore from '../../../stores/player/engine'
import { PlayerEngine } from '../../../stores/player/engine'
import { MediaPlayerState, useRemoteMediaClient, useStreamPosition } from 'react-native-google-cast'
import { useMemo, useState } from 'react'

export const useProgress = (UPDATE_INTERVAL: number): Progress => {
	const { position, duration, buffered } = useProgressRNTP(UPDATE_INTERVAL)

	const playerEngineData = usePlayerEngineStore((state) => state.playerEngineData)

	const isCasting = playerEngineData === PlayerEngine.GOOGLE_CAST
	const streamPosition = useStreamPosition()
	if (isCasting) {
		return {
			position: streamPosition || 0,
			duration,
			buffered: 0,
		}
	}

	return {
		position,
		duration,
		buffered,
	}
}

const castToRNTPState = (state: MediaPlayerState): State => {
	switch (state) {
		case MediaPlayerState.PLAYING:
			return State.Playing
		case MediaPlayerState.PAUSED:
			return State.Paused
		case MediaPlayerState.BUFFERING:
			return State.Buffering
		case MediaPlayerState.IDLE:
			return State.Ready
		case MediaPlayerState.LOADING:
			return State.Buffering
		default:
			return State.None
	}
}

export const usePlaybackState = (): State | undefined => {
	const { state } = usePlaybackStateRNTP()

	const playerEngineData = usePlayerEngineStore((state) => state.playerEngineData)

	const client = useRemoteMediaClient()

	const isCasting = playerEngineData === PlayerEngine.GOOGLE_CAST
	const [playbackState, setPlaybackState] = useState<State | undefined>(state)

	useMemo(() => {
		if (client && isCasting) {
			client.onMediaStatusUpdated((status) => {
				if (status?.playerState) {
					setPlaybackState(castToRNTPState(status.playerState))
				}
			})
		} else {
			setPlaybackState(state)
		}
	}, [client, isCasting, state])

	return playbackState
}
