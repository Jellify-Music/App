import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { SuggestionQueryKeys } from './keys'
import { fetchArtistSuggestions, fetchSearchSuggestions } from './utils/suggestions'
import { useApi, useJellifyLibrary, useJellifyUser, useAdapter } from '../../../stores'
import { isUndefined } from 'lodash'
import {
	unifiedArtistsToBaseItems,
	unifiedTracksToBaseItems,
	unifiedAlbumsToBaseItems,
} from '../../../utils/unified-conversions'

export const useSearchSuggestions = () => {
	const api = useApi()
	const adapter = useAdapter()
	const [library] = useJellifyLibrary()
	const [user] = useJellifyUser()

	return useQuery({
		queryKey: [
			SuggestionQueryKeys.SearchSuggestions,
			library?.musicLibraryId,
			adapter?.backend,
		],
		queryFn: async () => {
			// Use adapter for Navidrome (returns unified types, convert to BaseItemDto)
			if (adapter?.backend === 'navidrome' && adapter.getSearchSuggestions) {
				const suggestions = await adapter.getSearchSuggestions(10)
				return [
					...unifiedArtistsToBaseItems(suggestions.artists),
					...unifiedAlbumsToBaseItems(suggestions.albums),
					...unifiedTracksToBaseItems(suggestions.tracks),
				]
			}
			// Use Jellyfin-specific fetch for Jellyfin
			return fetchSearchSuggestions(api, user, library?.musicLibraryId)
		},
		enabled: !isUndefined(library) && !!adapter,
	})
}

export const useDiscoverArtists = () => {
	const api = useApi()
	const adapter = useAdapter()
	const [library] = useJellifyLibrary()
	const [user] = useJellifyUser()

	return useInfiniteQuery({
		queryKey: [
			SuggestionQueryKeys.InfiniteArtistSuggestions,
			user?.id,
			library?.musicLibraryId,
		],
		queryFn: async ({ pageParam }) => {
			// Use adapter for Navidrome
			if (adapter?.backend === 'navidrome') {
				// Navidrome getArtists returns all artists, slice for pagination
				const allArtists = await adapter.getArtists()
				const startIndex = pageParam * 50
				const paginatedArtists = allArtists.slice(startIndex, startIndex + 50)
				return unifiedArtistsToBaseItems(paginatedArtists)
			}
			// Use Jellyfin-specific fetch for Jellyfin
			return fetchArtistSuggestions(api, user, library?.musicLibraryId, pageParam)
		},
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) =>
			lastPage.length > 0 ? lastPageParam + 1 : undefined,
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		maxPages: 2,
	})
}
