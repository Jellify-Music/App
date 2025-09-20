import JellifyTrack from '../../../types/JellifyTrack'
import { queryClient } from '../../../constants/query-client'
import {
	ACTIVE_INDEX_QUERY_KEY,
	NOW_PLAYING_QUERY_KEY,
	PLAY_QUEUE_QUERY_KEY,
} from '../constants/query-keys'
import { CURRENT_INDEX_QUERY, NOW_PLAYING_QUERY } from '../constants/queries'

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

export function handleActiveTrackChanged(): void {
	queryClient.refetchQueries(NOW_PLAYING_QUERY)
	queryClient.refetchQueries(CURRENT_INDEX_QUERY)
}
