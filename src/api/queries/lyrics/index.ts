import { useQuery, UseQueryResult } from '@tanstack/react-query'
import LyricsQueryKey from './keys'
import { isUndefined } from 'lodash'
import { fetchRawLyrics } from './utils'
import { getApi } from '../../../stores/auth/utils'
import { useNowPlaying } from 'react-native-nitro-player'
import { ONE_DAY } from '../../../constants/query-client'

/**
 * A hook that will return a {@link useQuery}
 *
 * @returns a {@link UseQueryResult} for the
 */
const useRawLyrics = () => {
	const api = getApi()
	const { currentTrack } = useNowPlaying()

	return useQuery({
		queryKey: LyricsQueryKey(currentTrack),
		queryFn: ({ signal }) => fetchRawLyrics(api, currentTrack!.id!, signal),
		enabled: !isUndefined(currentTrack),
		staleTime: (data) => (!isUndefined(data) ? ONE_DAY : 0),
	})
}

export default useRawLyrics
