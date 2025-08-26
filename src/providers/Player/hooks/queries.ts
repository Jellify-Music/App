import { useQuery } from '@tanstack/react-query'
import PlayerQueryKeys from '../enums/queue-keys'
import TrackPlayer, {
	Progress,
	State,
	useProgress as useProgressRNTP,
	usePlaybackState as usePlaybackStateRNTP,
} from 'react-native-track-player'
import JellifyTrack from '../../../types/JellifyTrack'
import { Queue } from '../../../player/types/queue-item'
import { SHUFFLED_QUERY_KEY } from '../constants/query-keys'
import {
	CURRENT_INDEX_QUERY,
	NOW_PLAYING_QUERY,
	QUEUE_QUERY,
	REPEAT_MODE_QUERY,
} from '../constants/queries'
import usePlayerEngineStore from '../../../stores/player-engine'
import { PlayerEngine } from '../../../stores/player-engine'
import {
	MediaPlayerState,
	useMediaStatus,
	useRemoteMediaClient,
	useStreamPosition,
} from 'react-native-google-cast'
import { useEffect, useMemo, useState } from 'react'

const PLAYER_QUERY_OPTIONS = {
	enabled: true,
	retry: false,
	staleTime: Infinity,
	gcTime: Infinity,
	refetchOnWindowFocus: false,
	refetchOnReconnect: false,
	networkMode: 'always',
} as const

export const useCurrentIndex = () => useQuery(CURRENT_INDEX_QUERY)

export const useNowPlaying = () => useQuery(NOW_PLAYING_QUERY)

export const useQueue = () => useQuery(QUEUE_QUERY)

export const useShuffled = () =>
	useQuery<boolean>({
		queryKey: SHUFFLED_QUERY_KEY,
	})

export const useUnshuffledQueue = () =>
	useQuery<JellifyTrack[]>({
		queryKey: [PlayerQueryKeys.UnshuffledQueue],
		...PLAYER_QUERY_OPTIONS,
	})

export const useQueueRef = () =>
	useQuery<Queue>({
		queryKey: [PlayerQueryKeys.PlayQueueRef],
		...PLAYER_QUERY_OPTIONS,
	})

export const useRepeatMode = () => useQuery(REPEAT_MODE_QUERY)

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

	console.log('state', state)
	const playerEngineData = usePlayerEngineStore((state) => state.playerEngineData)

	const client = useRemoteMediaClient()

	const isCasting = playerEngineData === PlayerEngine.GOOGLE_CAST
	const [playbackState, setPlaybackState] = useState<State | undefined>(state)

	useMemo(() => {
		if (client && isCasting) {
			client.onMediaStatusUpdated((status) => {
				status?.playerState && setPlaybackState(castToRNTPState(status.playerState))
			})
		} else {
			setPlaybackState(state)
		}
	}, [client, isCasting, state])

	return playbackState
}
