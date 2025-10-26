import { useInfiniteQuery } from '@tanstack/react-query'
import { FrequentlyPlayedArtistsQueryKey, FrequentlyPlayedTracksQueryKey } from './keys'
import { useJellifyContext } from '../../../providers'
import { fetchFrequentlyPlayed, fetchFrequentlyPlayedArtists } from './utils/frequents'
import { ApiLimits } from '../query.config'
import { isUndefined } from 'lodash'

const FREQUENTS_QUERY_CONFIG = {
	refetchOnMount: false,
	staleTime: Infinity,
} as const

export const useFrequentlyPlayedTracks = () => {
	const { api, user, library } = useJellifyContext()

	return useInfiniteQuery({
		queryKey: FrequentlyPlayedTracksQueryKey(user, library),
		queryFn: ({ pageParam }) => fetchFrequentlyPlayed(api, library, pageParam),
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			console.debug('Getting next page for frequently played')
			return lastPage.length === ApiLimits.Home ? lastPageParam + 1 : undefined
		},
		...FREQUENTS_QUERY_CONFIG,
	})
}

export const useFrequentlyPlayedArtists = () => {
	const { api, user, library } = useJellifyContext()

	const { data: frequentlyPlayedTracks } = useFrequentlyPlayedTracks()

	return useInfiniteQuery({
		queryKey: FrequentlyPlayedArtistsQueryKey(user, library),
		queryFn: ({ pageParam }) => fetchFrequentlyPlayedArtists(api, user, library, pageParam),
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			console.debug('Getting next page for frequent artists')
			return lastPage.length > 0 ? lastPageParam + 1 : undefined
		},
		enabled: !isUndefined(frequentlyPlayedTracks),
		...FREQUENTS_QUERY_CONFIG,
	})
}
