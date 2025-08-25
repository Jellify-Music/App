import JellifyTrack from '../../../types/JellifyTrack'
import PlayerQueryKeys from '../enums/queue-keys'
import { PLAY_QUEUE_QUERY_KEY } from './query-keys'
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
	queryKey: [PlayerQueryKeys.ActiveIndex],
	queryFn: TrackPlayer.getActiveTrackIndex,
	...PLAYER_QUERY_OPTIONS,
}
