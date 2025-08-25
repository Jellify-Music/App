import { queryClient } from '../../../constants/query-client'
import {
	ACTIVE_INDEX_QUERY_KEY,
	NOW_PLAYING_QUERY_KEY,
	PLAY_QUEUE_QUERY_KEY,
	REPEAT_MODE_QUERY_KEY,
} from '../constants/query-keys'
import TrackPlayer from 'react-native-track-player'

export function invalidateActiveIndex(): void {
	queryClient.invalidateQueries({ queryKey: ACTIVE_INDEX_QUERY_KEY })
}

export function invalidateNowPlaying(): void {
	queryClient.invalidateQueries({ queryKey: NOW_PLAYING_QUERY_KEY })

	invalidateActiveIndex()
}

/**
 * Invalidates the play queue queryable and - because this may impact
 * which track is being played, invalidates the now playing queryable
 * as well.
 *
 * Under the hood, this will refetch the active queue from the {@link TrackPlayer}
 * and the currently playing track
 */
export function invalidatePlayerQueue(): void {
	queryClient.invalidateQueries({ queryKey: PLAY_QUEUE_QUERY_KEY })

	invalidateNowPlaying()
}

export function invalidateRepeatMode(): void {
	queryClient.invalidateQueries({ queryKey: REPEAT_MODE_QUERY_KEY })
}
