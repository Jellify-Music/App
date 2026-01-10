import { useQuery, UseQueryResult } from '@tanstack/react-query'
import LyricsQueryKey from './keys'
import { isUndefined } from 'lodash'
import { fetchRawLyrics } from './utils'
import { useApi } from '../../../stores'
import { usePlayerQueueStore } from '../../../stores/player/queue'
import { useNowPlaying } from 'react-native-nitro-player'
import JellifyTrack from '../../../types/JellifyTrack'

/**
 * A hook that will return a {@link useQuery}
 *
 * @returns a {@link UseQueryResult} for the
 */
const useRawLyrics = () => {
	const api = useApi()
	const playerState = useNowPlaying()
	const currentTrack = playerState.currentTrack
	const queue = usePlayerQueueStore((state) => state.queue)
	// Find the full JellifyTrack in the queue by ID
	const nowPlaying = currentTrack
		? ((queue.find((t) => t.id === currentTrack.id) as JellifyTrack | undefined) ?? undefined)
		: undefined

	return useQuery({
		queryKey: LyricsQueryKey(nowPlaying),
		queryFn: () => fetchRawLyrics(api, nowPlaying!.item.Id!),
		enabled: !isUndefined(nowPlaying),
		staleTime: (data) => (!isUndefined(data) ? Infinity : 0),
	})
}

export default useRawLyrics
