import { RecentlyPlayedArtistsQueryKey, RecentlyPlayedTracksQueryKey } from './keys'
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchRecentlyPlayed, fetchRecentlyPlayedArtists } from './utils'
import { ApiLimits, MaxPages } from '../../../configs/query.config'
import { isUndefined } from 'lodash'
import { useApi, useJellifyUser, useJellifyLibrary, useAdapter } from '../../../stores'
import {
	unifiedTracksToBaseItems,
	unifiedArtistsToBaseItems,
} from '../../../utils/unified-conversions'

const RECENTS_QUERY_CONFIG = {
	maxPages: MaxPages.Home,
	refetchOnMount: false,
} as const

export const useRecentlyPlayedTracks = () => {
	const api = useApi()
	const adapter = useAdapter()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()

	return useInfiniteQuery({
		queryKey: RecentlyPlayedTracksQueryKey(user, library),
		queryFn: async ({ pageParam }) => {
			// Use adapter for both backends (if method exists)
			if (adapter?.getRecentTracks) {
				const tracks = await adapter.getRecentTracks(ApiLimits.Home * (pageParam + 1))
				// Paginate the results client-side
				const startIndex = pageParam * ApiLimits.Home
				const paginatedTracks = tracks.slice(startIndex, startIndex + ApiLimits.Home)
				return unifiedTracksToBaseItems(paginatedTracks)
			}
			// Fallback to Jellyfin-specific fetch
			return fetchRecentlyPlayed(api, user, library, pageParam)
		},
		initialPageParam: 0,
		select: (data) => data.pages.flatMap((page) => page),
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			return lastPage.length === ApiLimits.Home ? lastPageParam + 1 : undefined
		},
		enabled: !!adapter?.getRecentTracks,
		...RECENTS_QUERY_CONFIG,
	})
}

export const useRecentArtists = () => {
	const api = useApi()
	const adapter = useAdapter()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()

	const { data: recentlyPlayedTracks } = useRecentlyPlayedTracks()

	return useInfiniteQuery({
		queryKey: RecentlyPlayedArtistsQueryKey(user, library),
		queryFn: async ({ pageParam }) => {
			// Use adapter for both backends (if method exists)
			if (adapter?.getRecentArtists) {
				const artists = await adapter.getRecentArtists(ApiLimits.Home * (pageParam + 1))
				// Paginate the results client-side
				const startIndex = pageParam * ApiLimits.Home
				const paginatedArtists = artists.slice(startIndex, startIndex + ApiLimits.Home)
				return unifiedArtistsToBaseItems(paginatedArtists)
			}
			// Fallback to Jellyfin-specific fetch
			return fetchRecentlyPlayedArtists(api, user, library, pageParam)
		},
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			return lastPage.length > 0 ? lastPageParam + 1 : undefined
		},
		enabled: !!adapter?.getRecentArtists && !isUndefined(recentlyPlayedTracks),
		...RECENTS_QUERY_CONFIG,
	})
}
