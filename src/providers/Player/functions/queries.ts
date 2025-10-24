import { queryClient } from '../../../constants/query-client'
import {
	CURRENT_INDEX_QUERY,
	NOW_PLAYING_QUERY,
	QUEUE_QUERY,
	REPEAT_MODE_QUERY,
} from '../constants/queries'
import TrackPlayer from 'react-native-track-player'
import { usePlayerQueueStore } from '../../../stores/player/queue'
import JellifyTrack from '../../../types/JellifyTrack'

export async function refetchActiveIndex(): Promise<void> {
	await queryClient.refetchQueries(CURRENT_INDEX_QUERY)

	const activeIndex = await TrackPlayer.getActiveTrackIndex()
	usePlayerQueueStore.getState().setCurrentIndex(activeIndex ?? null)
}

export async function refetchNowPlaying(): Promise<void> {
	await queryClient.refetchQueries(NOW_PLAYING_QUERY)

	const [activeTrack, queue] = await Promise.all([
		TrackPlayer.getActiveTrack(),
		TrackPlayer.getQueue(),
	])

	usePlayerQueueStore.getState().setCurrentTrack((activeTrack as JellifyTrack) ?? null)
	usePlayerQueueStore.getState().setQueue(queue as JellifyTrack[])

	await refetchActiveIndex()
}

/**
 * Refetches the play queue queryable and - because this may impact
 * which track is being played, invalidates the now playing queryable
 * as well.
 *
 * Under the hood, this will refetch the active queue from the {@link TrackPlayer}
 * and the currently playing track
 */
export async function refetchPlayerQueue(): Promise<void> {
	await queryClient.refetchQueries(QUEUE_QUERY)

	await refetchNowPlaying()
}

export function invalidateRepeatMode(): void {
	queryClient.refetchQueries(REPEAT_MODE_QUERY)
}
