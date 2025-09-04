import { useJellifyContext } from '../../../providers'
import { RecentlyPlayedArtistsQueryKey, RecentlyPlayedTracksQueryKey } from './keys'
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchRecentlyPlayed, fetchRecentlyPlayedArtists } from './utils'
import { ApiLimits } from '../query.config'
import { queryClient } from '../../../constants/query-client'
import { isUndefined } from 'lodash'

export const useRecentlyPlayedTracks = () => {
	const { api, user, library } = useJellifyContext()

	return useInfiniteQuery({
		queryKey: RecentlyPlayedTracksQueryKey(user, library),
		queryFn: ({ pageParam }) => fetchRecentlyPlayed(api, user, library, pageParam),
		initialPageParam: 0,
		select: (data) => data.pages.flatMap((page) => page),
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			console.debug('Getting next page for recent tracks')
			return lastPage.length === ApiLimits.Home ? lastPageParam + 1 : undefined
		},
	})
}

export const useRecentArtists = () => {
	const { api, user, library } = useJellifyContext()

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
	})
}
