import { useInfiniteQuery } from '@tanstack/react-query'
import { FrequentlyPlayedArtistsQueryKey } from './keys'
import { fetchFrequentlyPlayedArtists } from './utils/frequents'
import { getApi, getUser } from '../../../stores/auth/utils'
import { useJellifyLibrary } from '../../../stores/auth'
import { QueryAges } from '../../../constants/durations'
import { FrequentlyPlayedTracksQuery } from './queries'
import { BaseItemDtoInfiniteQueryOptions } from '../../types/infinite-query'

const FREQUENTS_QUERY_CONFIG: Pick<
	BaseItemDtoInfiniteQueryOptions,
	'staleTime' | 'refetchOnMount'
> = {
	staleTime: QueryAges.OneDay,
	refetchOnMount: false,
} as const

export const useFrequentlyPlayedTracks = () => {
	const api = getApi()
	const user = getUser()
	const [library] = useJellifyLibrary()

	return useInfiniteQuery(FrequentlyPlayedTracksQuery(user, library, api))
}

export const useFrequentlyPlayedArtists = () => {
	const api = getApi()
	const user = getUser()
	const [library] = useJellifyLibrary()

	return useInfiniteQuery({
		queryKey: FrequentlyPlayedArtistsQueryKey(user, library),
		queryFn: ({ pageParam, signal }) =>
			fetchFrequentlyPlayedArtists(api, user, library, pageParam, signal),
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			return lastPage.length > 0 ? lastPageParam + 1 : undefined
		},
		...FREQUENTS_QUERY_CONFIG,
	})
}
