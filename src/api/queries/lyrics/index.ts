import { useQuery, UseQueryResult } from '@tanstack/react-query'
import LyricsQueryKey from './keys'
import { fetchRawLyrics } from './utils'
import { getApi } from '../../../stores/auth/utils'
import { useNowPlaying } from 'react-native-nitro-player'
import { QueryAges } from '../../../constants/durations'
import getTrackDto from '../../../utils/mapping/track-extra-payload'

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
		queryFn: ({ signal }) => fetchRawLyrics(api, getTrackDto(currentTrack!)!.Id!, signal),
		enabled: Boolean(currentTrack),
		staleTime: ({ state }) => (state.data ? QueryAges.OneDay : 0),
		gcTime: QueryAges.OneWeek,
	})
}

export default useRawLyrics
