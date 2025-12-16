import { useInfiniteQuery } from '@tanstack/react-query'
import { FrequentlyPlayedArtistsQueryKey, FrequentlyPlayedTracksQueryKey } from './keys'
import { fetchFrequentlyPlayed, fetchFrequentlyPlayedArtists } from './utils/frequents'
import { ApiLimits, MaxPages } from '../../../configs/query.config'
import { isUndefined } from 'lodash'
import { useApi, useJellifyLibrary, useJellifyUser, useAdapter } from '../../../stores'
import {
	unifiedTracksToBaseItems,
	unifiedArtistsToBaseItems,
} from '../../../utils/unified-conversions'

const FREQUENTS_QUERY_CONFIG = {
	maxPages: MaxPages.Home,
	refetchOnMount: false,
} as const

export const useFrequentlyPlayedTracks = () => {
	const api = useApi()
	const adapter = useAdapter()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()

	return useInfiniteQuery({
		queryKey: FrequentlyPlayedTracksQueryKey(user, library),
		queryFn: async ({ pageParam }) => {
			// Use adapter for both backends (if method exists)
			if (adapter?.getFrequentTracks) {
				const tracks = await adapter.getFrequentTracks(ApiLimits.Home * (pageParam + 1))
				// Paginate the results client-side
				const startIndex = pageParam * ApiLimits.Home
				const paginatedTracks = tracks.slice(startIndex, startIndex + ApiLimits.Home)
				return unifiedTracksToBaseItems(paginatedTracks)
			}
			// Fallback to Jellyfin-specific fetch
			return fetchFrequentlyPlayed(api, library, pageParam)
		},
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			return lastPage.length === ApiLimits.Home ? lastPageParam + 1 : undefined
		},
		enabled: !!adapter?.getFrequentTracks,
		...FREQUENTS_QUERY_CONFIG,
	})
}

export const useFrequentlyPlayedArtists = () => {
	const api = useApi()
	const adapter = useAdapter()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()

	const { data: frequentlyPlayedTracks } = useFrequentlyPlayedTracks()

	return useInfiniteQuery({
		queryKey: FrequentlyPlayedArtistsQueryKey(user, library),
		queryFn: async ({ pageParam }) => {
			// Use adapter for both backends (if method exists)
			if (adapter?.getFrequentArtists) {
				const artists = await adapter.getFrequentArtists(ApiLimits.Home * (pageParam + 1))
				// Paginate the results client-side
				const startIndex = pageParam * ApiLimits.Home
				const paginatedArtists = artists.slice(startIndex, startIndex + ApiLimits.Home)
				return unifiedArtistsToBaseItems(paginatedArtists)
			}
			// Fallback to Jellyfin-specific fetch
			return fetchFrequentlyPlayedArtists(api, user, library, pageParam)
		},
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			return lastPage.length > 0 ? lastPageParam + 1 : undefined
		},
		enabled: !!adapter?.getFrequentArtists && !isUndefined(frequentlyPlayedTracks),
		...FREQUENTS_QUERY_CONFIG,
	})
}
