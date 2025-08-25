import { queryClient } from '../../../constants/query-client'
import {
	CURRENT_INDEX_QUERY,
	NOW_PLAYING_QUERY,
	QUEUE_QUERY,
	REPEAT_MODE_QUERY,
} from '../constants/queries'
import TrackPlayer from 'react-native-track-player'

export function refetchActiveIndex(): void {
	queryClient.refetchQueries(CURRENT_INDEX_QUERY)
}

export function refetchNowPlaying(): void {
	queryClient.refetchQueries(NOW_PLAYING_QUERY)

	refetchActiveIndex()
}

/**
 * Refetches the play queue queryable and - because this may impact
 * which track is being played, invalidates the now playing queryable
 * as well.
 *
 * Under the hood, this will refetch the active queue from the {@link TrackPlayer}
 * and the currently playing track
 */
export function refetchPlayerQueue(): void {
	queryClient.refetchQueries(QUEUE_QUERY)

	refetchNowPlaying()
}

export function invalidateRepeatMode(): void {
	queryClient.refetchQueries(REPEAT_MODE_QUERY)
}
