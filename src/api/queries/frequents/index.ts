import { useInfiniteQuery } from '@tanstack/react-query'
import { FrequentlyPlayedArtistsQueryKey, FrequentlyPlayedTracksQueryKey } from './keys'
import { fetchFrequentlyPlayed, fetchFrequentlyPlayedArtists } from './utils/frequents'
import { ApiLimits, MaxPages } from '../../../configs/query.config'
import { isUndefined } from 'lodash'
import { useApi, useJellifyLibrary, useJellifyUser } from '../../../stores'
import { ONE_DAY } from '../../../constants/query-client'

const FREQUENTS_QUERY_CONFIG = {
	maxPages: MaxPages.Home,
	staleTime: ONE_DAY,
	refetchOnMount: false,
} as const

export const useFrequentlyPlayedTracks = () => {
	const api = useApi()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()

	return useInfiniteQuery({
		queryKey: FrequentlyPlayedTracksQueryKey(user, library),
		queryFn: ({ pageParam }) => fetchFrequentlyPlayed(api, library, pageParam),
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			return lastPage.length === ApiLimits.Home ? lastPageParam + 1 : undefined
		},
		...FREQUENTS_QUERY_CONFIG,
	})
}

export const useFrequentlyPlayedArtists = () => {
	const api = useApi()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()

	const { data: frequentlyPlayedTracks } = useFrequentlyPlayedTracks()

	return useInfiniteQuery({
		queryKey: FrequentlyPlayedArtistsQueryKey(user, library),
		queryFn: ({ pageParam }) => fetchFrequentlyPlayedArtists(api, user, library, pageParam),
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			return lastPage.length > 0 ? lastPageParam + 1 : undefined
		},
		enabled: !isUndefined(frequentlyPlayedTracks),
		...FREQUENTS_QUERY_CONFIG,
	})
}
