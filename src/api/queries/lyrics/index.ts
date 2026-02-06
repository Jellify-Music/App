import { useQuery, UseQueryResult } from '@tanstack/react-query'
import LyricsQueryKey from './keys'
import { isUndefined } from 'lodash'
import { fetchRawLyrics } from './utils'
import { getApi, useApi } from '../../../stores'
import { usePlayerQueueStore } from '../../../stores/player/queue'
import { useNowPlaying } from 'react-native-nitro-player'
import JellifyTrack from '../../../types/JellifyTrack'

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
		queryFn: () => fetchRawLyrics(api, currentTrack!.id!),
		enabled: !isUndefined(currentTrack),
		staleTime: (data) => (!isUndefined(data) ? Infinity : 0),
	})
}

export default useRawLyrics
