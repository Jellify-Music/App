import { RecentlyPlayedArtistsQueryKey, RecentlyPlayedTracksQueryKey } from './keys'
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchRecentlyPlayed, fetchRecentlyPlayedArtists } from './utils'
import { ApiLimits, MaxPages } from '../../../configs/query.config'
import { isUndefined } from 'lodash'
import { useApi, useJellifyUser, useJellifyLibrary, useJellifyServer } from '../../../stores'

const RECENTS_QUERY_CONFIG = {
	maxPages: MaxPages.Home,
	refetchOnMount: false,
} as const

export const useRecentlyPlayedTracks = () => {
	const api = useApi()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()
	const [server] = useJellifyServer()

	// Only run for Jellyfin backend - Navidrome uses different queries
	const isJellyfin = server?.backend !== 'navidrome'

	return useInfiniteQuery({
		queryKey: RecentlyPlayedTracksQueryKey(user, library),
		queryFn: ({ pageParam }) => fetchRecentlyPlayed(api, user, library, pageParam),
		initialPageParam: 0,
		select: (data) => data.pages.flatMap((page) => page),
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			return lastPage.length === ApiLimits.Home ? lastPageParam + 1 : undefined
		},
		enabled: isJellyfin,
		...RECENTS_QUERY_CONFIG,
	})
}

export const useRecentArtists = () => {
	const api = useApi()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()
	const [server] = useJellifyServer()

	const { data: recentlyPlayedTracks } = useRecentlyPlayedTracks()

	// Only run for Jellyfin backend
	const isJellyfin = server?.backend !== 'navidrome'

	return useInfiniteQuery({
		queryKey: RecentlyPlayedArtistsQueryKey(user, library),
		queryFn: ({ pageParam }) => fetchRecentlyPlayedArtists(api, user, library, pageParam),
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			return lastPage.length > 0 ? lastPageParam + 1 : undefined
		},
		enabled: isJellyfin && !isUndefined(recentlyPlayedTracks),
		...RECENTS_QUERY_CONFIG,
	})
}
