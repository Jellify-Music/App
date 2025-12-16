import { useInfiniteQuery } from '@tanstack/react-query'
import { FrequentlyPlayedArtistsQueryKey, FrequentlyPlayedTracksQueryKey } from './keys'
import { fetchFrequentlyPlayed, fetchFrequentlyPlayedArtists } from './utils/frequents'
import { ApiLimits, MaxPages } from '../../../configs/query.config'
import { isUndefined } from 'lodash'
import { useApi, useJellifyLibrary, useJellifyUser, useJellifyServer } from '../../../stores'

const FREQUENTS_QUERY_CONFIG = {
	maxPages: MaxPages.Home,
	refetchOnMount: false,
} as const

export const useFrequentlyPlayedTracks = () => {
	const api = useApi()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()
	const [server] = useJellifyServer()

	// Only run for Jellyfin backend - Navidrome uses different queries
	const isJellyfin = server?.backend !== 'navidrome'

	return useInfiniteQuery({
		queryKey: FrequentlyPlayedTracksQueryKey(user, library),
		queryFn: ({ pageParam }) => fetchFrequentlyPlayed(api, library, pageParam),
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			return lastPage.length === ApiLimits.Home ? lastPageParam + 1 : undefined
		},
		enabled: isJellyfin,
		...FREQUENTS_QUERY_CONFIG,
	})
}

export const useFrequentlyPlayedArtists = () => {
	const api = useApi()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()
	const [server] = useJellifyServer()

	const { data: frequentlyPlayedTracks } = useFrequentlyPlayedTracks()

	// Only run for Jellyfin backend
	const isJellyfin = server?.backend !== 'navidrome'

	return useInfiniteQuery({
		queryKey: FrequentlyPlayedArtistsQueryKey(user, library),
		queryFn: ({ pageParam }) => fetchFrequentlyPlayedArtists(api, user, library, pageParam),
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			return lastPage.length > 0 ? lastPageParam + 1 : undefined
		},
		enabled: isJellyfin && !isUndefined(frequentlyPlayedTracks),
		...FREQUENTS_QUERY_CONFIG,
	})
}
