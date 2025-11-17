import { RecentlyPlayedArtistsQueryKey, RecentlyPlayedTracksQueryKey } from './keys'
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchRecentlyPlayed, fetchRecentlyPlayedArtists } from './utils'
import { ApiLimits } from '../../../configs/query.config'
import { isUndefined } from 'lodash'
import { useApi, useJellifyUser, useJellifyLibrary } from '../../../stores'

const RECENTS_QUERY_CONFIG = {
	maxPages: 2,
	refetchOnMount: false,
	staleTime: Infinity,
} as const

export const useRecentlyPlayedTracks = () => {
	const api = useApi()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()

	return useInfiniteQuery({
		queryKey: RecentlyPlayedTracksQueryKey(user, library),
		queryFn: ({ pageParam }) => fetchRecentlyPlayed(api, user, library, pageParam),
		initialPageParam: 0,
		select: (data) => data.pages.flatMap((page) => page),
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			console.debug('Getting next page for recent tracks')
			return lastPage.length === ApiLimits.Home ? lastPageParam + 1 : undefined
		},
		...RECENTS_QUERY_CONFIG,
	})
}

export const useRecentArtists = () => {
	const api = useApi()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()

	const { data: recentlyPlayedTracks } = useRecentlyPlayedTracks()

	return useInfiniteQuery({
		queryKey: RecentlyPlayedArtistsQueryKey(user, library),
		queryFn: ({ pageParam }) => fetchRecentlyPlayedArtists(api, user, library, pageParam),
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			console.debug('Getting next page for recent artists')
			return lastPage.length > 0 ? lastPageParam + 1 : undefined
		},
		enabled: !isUndefined(recentlyPlayedTracks),
		...RECENTS_QUERY_CONFIG,
	})
}
