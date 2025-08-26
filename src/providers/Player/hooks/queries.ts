import { useQuery } from '@tanstack/react-query'
import PlayerQueryKeys from '../enums/queue-keys'
import TrackPlayer from 'react-native-track-player'
import JellifyTrack from '../../../types/JellifyTrack'
import { Queue } from '../../../player/types/queue-item'
import { SHUFFLED_QUERY_KEY } from '../constants/query-keys'
import {
	CURRENT_INDEX_QUERY,
	NOW_PLAYING_QUERY,
	QUEUE_QUERY,
	REPEAT_MODE_QUERY,
} from '../constants/queries'

const PLAYER_QUERY_OPTIONS = {
	enabled: true,
	retry: false,
	staleTime: Infinity,
	gcTime: Infinity,
	refetchOnWindowFocus: false,
	refetchOnReconnect: false,
	networkMode: 'always',
} as const

export const usePlaybackState = () =>
	useQuery({
		queryKey: [PlayerQueryKeys.PlaybackState],
		queryFn: TrackPlayer.getPlaybackState,
		...PLAYER_QUERY_OPTIONS,
	})

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
