import JellifyTrack from '../../../types/JellifyTrack'
import PlayerQueryKeys from '../enums/queue-keys'
import {
	ACTIVE_INDEX_QUERY_KEY,
	NOW_PLAYING_QUERY_KEY,
	PLAY_QUEUE_QUERY_KEY,
	REPEAT_MODE_QUERY_KEY,
} from './query-keys'
import TrackPlayer, { Track } from 'react-native-track-player'

const PLAYER_QUERY_OPTIONS = {
	enabled: true,
	retry: false,
	staleTime: Infinity,
	gcTime: Infinity,
	refetchOnWindowFocus: false,
	refetchOnReconnect: false,
	networkMode: 'always',
} as const

export const QUEUE_QUERY = {
	queryKey: PLAY_QUEUE_QUERY_KEY,
	queryFn: TrackPlayer.getQueue,
	select: (data: Track[]) => data as JellifyTrack[],
	...PLAYER_QUERY_OPTIONS,
}

export const CURRENT_INDEX_QUERY = {
	queryKey: ACTIVE_INDEX_QUERY_KEY,
	queryFn: TrackPlayer.getActiveTrackIndex,
	...PLAYER_QUERY_OPTIONS,
}

export const NOW_PLAYING_QUERY = {
	queryKey: NOW_PLAYING_QUERY_KEY,
	queryFn: TrackPlayer.getActiveTrack,
	select: (data: Track | undefined) => data as JellifyTrack | undefined,
	...PLAYER_QUERY_OPTIONS,
}

export const REPEAT_MODE_QUERY = {
	queryKey: REPEAT_MODE_QUERY_KEY,
	queryFn: TrackPlayer.getRepeatMode,
	...PLAYER_QUERY_OPTIONS,
}
