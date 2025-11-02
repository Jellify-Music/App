import { useQuery, UseQueryResult } from '@tanstack/react-query'
import LyricsQueryKey from './keys'
import { isUndefined } from 'lodash'
import { fetchRawLyrics } from './utils'
import { useApi } from '../../../stores'
import { useCurrentTrack } from '../../../stores/player/queue'

/**
 * A hook that will return a {@link useQuery}
 *
 * @returns a {@link UseQueryResult} for the
 */
const useRawLyrics = () => {
	const api = useApi()
	const nowPlaying = useCurrentTrack()

	return useQuery({
		queryKey: LyricsQueryKey(nowPlaying),
		queryFn: () => fetchRawLyrics(api, nowPlaying!.item.Id!),
		enabled: !isUndefined(nowPlaying),
		staleTime: (data) => (!isUndefined(data) ? Infinity : 0),
	})
}

export default useRawLyrics
