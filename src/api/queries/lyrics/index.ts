import { useNowPlaying } from '../../../providers/Player/hooks/queries'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import LyricsQueryKey from './keys'
import { isUndefined } from 'lodash'
import { fetchRawLyrics } from './utils'
import { useJellifyContext } from '../../../providers'

/**
 * A hook that will return a {@link useQuery}
 *
 * @returns a {@link UseQueryResult} for the
 */
const useRawLyrics = () => {
	const { api } = useJellifyContext()
	const { data: nowPlaying } = useNowPlaying()

	return useQuery({
		queryKey: LyricsQueryKey(nowPlaying),
		queryFn: () => fetchRawLyrics(api, nowPlaying!.item.Id!),
		enabled: !isUndefined(nowPlaying),
		staleTime: (data) => (!isUndefined(data) ? Infinity : 0),
	})
}

export default useRawLyrics
