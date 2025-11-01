import TrackPlayer from 'react-native-track-player'
import JellifyTrack from '../../../types/JellifyTrack'
import { queryClient } from '../../../constants/query-client'
import {
	ACTIVE_INDEX_QUERY_KEY,
	NOW_PLAYING_QUERY_KEY,
	PLAY_QUEUE_QUERY_KEY,
} from '../constants/query-keys'
import { usePlayerQueueStore } from '../../../stores/player/queue'

export function getActiveIndex(): number | undefined {
	return queryClient.getQueryData(ACTIVE_INDEX_QUERY_KEY) as number | undefined
}

export function setActiveIndex(index: number): void {
	queryClient.setQueryData(ACTIVE_INDEX_QUERY_KEY, index)
}

export function getCurrentTrack(): JellifyTrack | undefined {
	return queryClient.getQueryData(NOW_PLAYING_QUERY_KEY)
}

export function getPlayQueue(): JellifyTrack[] | undefined {
	return queryClient.getQueryData(PLAY_QUEUE_QUERY_KEY) as JellifyTrack[] | undefined
}

export function setPlayQueue(tracks: JellifyTrack[]): void {
	queryClient.setQueryData(PLAY_QUEUE_QUERY_KEY, tracks)
}

export async function handleActiveTrackChanged(): Promise<void> {
	const [queue, activeTrack, activeIndex] = await Promise.all([
		TrackPlayer.getQueue(),
		TrackPlayer.getActiveTrack(),
		TrackPlayer.getActiveTrackIndex(),
	])

	usePlayerQueueStore.getState().setQueue(queue as JellifyTrack[])
	usePlayerQueueStore.getState().setCurrentTrack(activeTrack as JellifyTrack)
	usePlayerQueueStore.getState().setCurrentIndex(activeIndex)
}
