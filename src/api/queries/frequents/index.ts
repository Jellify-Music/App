import { useInfiniteQuery } from '@tanstack/react-query'
import { FrequentlyPlayedArtistsQueryKey, FrequentlyPlayedTracksQueryKey } from './keys'
import { fetchFrequentlyPlayed, fetchFrequentlyPlayedArtists } from './utils/frequents'
import { ApiLimits, MaxPages } from '../../../configs/query.config'
import { getApi, getUser, useJellifyLibrary } from '../../../stores'
import { ONE_DAY } from '../../../constants/query-client'
import { FrequentlyPlayedTracksQuery } from './queries'

const FREQUENTS_QUERY_CONFIG = {
	maxPages: MaxPages.Home,
	staleTime: ONE_DAY,
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
		queryFn: ({ pageParam }) => fetchFrequentlyPlayedArtists(api, user, library, pageParam),
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			return lastPage.length > 0 ? lastPageParam + 1 : undefined
		},
		...FREQUENTS_QUERY_CONFIG,
	})
}
