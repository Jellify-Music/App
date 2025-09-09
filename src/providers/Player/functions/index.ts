import JellifyTrack from '../../../types/JellifyTrack'
import { queryClient } from '../../../constants/query-client'
import { Queue } from '../../../player/types/queue-item'
import {
	ACTIVE_INDEX_QUERY_KEY,
	NOW_PLAYING_QUERY_KEY,
	PLAY_QUEUE_QUERY_KEY,
	QUEUE_REF_QUERY_KEY,
	SHUFFLED_QUERY_KEY,
	UNSHUFFLED_QUEUE_QUERY_KEY,
} from '../constants/query-keys'
import { CURRENT_INDEX_QUERY, NOW_PLAYING_QUERY, QUEUE_QUERY } from '../constants/queries'

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

export function setQueueRef(queueRef: Queue): void {
	queryClient.setQueryData(QUEUE_REF_QUERY_KEY, queueRef)
}

export function getUnshuffledQueue(): JellifyTrack[] | undefined {
	return queryClient.getQueryData(UNSHUFFLED_QUEUE_QUERY_KEY) as JellifyTrack[] | undefined
}

export function setUnshuffledQueue(tracks: JellifyTrack[]): void {
	queryClient.setQueryData(UNSHUFFLED_QUEUE_QUERY_KEY, tracks)
}

export function getShuffled(): boolean | undefined {
	return queryClient.getQueryData(SHUFFLED_QUERY_KEY) as boolean | undefined
}

export function setShuffled(shuffled: boolean): void {
	queryClient.setQueryData(SHUFFLED_QUERY_KEY, shuffled)
}

export function handleActiveTrackChanged(): void {
	queryClient.invalidateQueries(NOW_PLAYING_QUERY)
	queryClient.ensureQueryData(QUEUE_QUERY)
	queryClient.invalidateQueries(CURRENT_INDEX_QUERY)
}
