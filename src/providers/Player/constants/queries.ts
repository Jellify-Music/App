import JellifyTrack from '../../../types/JellifyTrack'
import PlayerQueryKeys from '../enums/queue-keys'
import {
	NOW_PLAYING_QUERY_KEY,
	PLAY_QUEUE_QUERY_KEY,
	REPEAT_MODE_QUERY_KEY,
	SHUFFLED_QUERY_KEY,
	UNSHUFFLED_QUEUE_QUERY_KEY,
	QUEUE_REF_QUERY_KEY,
} from './query-keys'
import TrackPlayer, { Track } from 'react-native-track-player'
import { queryClient } from '../../../constants/query-client'
import { Queue } from '../../../player/types/queue-item'

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

// Local-only queries that are managed via setQueryData elsewhere
export const SHUFFLED_QUERY = {
	queryKey: SHUFFLED_QUERY_KEY,
	// Read from cache; default to false when not set
	queryFn: () => (queryClient.getQueryData(SHUFFLED_QUERY_KEY) as boolean | undefined) ?? false,
	initialData: false as boolean,
	...PLAYER_QUERY_OPTIONS,
}

export const UNSHUFFLED_QUEUE_QUERY = {
	queryKey: UNSHUFFLED_QUEUE_QUERY_KEY,
	// Read from cache; default to empty queue
	queryFn: () =>
		(queryClient.getQueryData(UNSHUFFLED_QUEUE_QUERY_KEY) as JellifyTrack[] | undefined) ?? [],
	initialData: [] as JellifyTrack[],
	...PLAYER_QUERY_OPTIONS,
}

export const QUEUE_REF_QUERY = {
	queryKey: QUEUE_REF_QUERY_KEY,
	// Read from cache; default to 'Recently Played'
	queryFn: () =>
		(queryClient.getQueryData(QUEUE_REF_QUERY_KEY) as Queue | undefined) ?? 'Recently Played',
	initialData: 'Recently Played' as Queue,
	...PLAYER_QUERY_OPTIONS,
}
