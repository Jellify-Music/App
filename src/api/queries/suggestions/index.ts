import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { SuggestionQueryKeys } from './keys'
import { fetchArtistSuggestions, fetchSearchSuggestions } from './utils/suggestions'
import { useApi, useJellifyLibrary, useJellifyUser } from '../../../stores'
import { isUndefined } from 'lodash'
import fetchSimilarArtists, { fetchSimilarItems } from './utils/similar'
import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client'

export const useSearchSuggestions = () => {
	const api = useApi()

	const [library] = useJellifyLibrary()

	const [user] = useJellifyUser()

	return useQuery({
		queryKey: [SuggestionQueryKeys.SearchSuggestions, library?.musicLibraryId],
		queryFn: () => fetchSearchSuggestions(api, user, library?.musicLibraryId),
		enabled: !isUndefined(library),
	})
}

export const useDiscoverArtists = () => {
	const api = useApi()

	const [library] = useJellifyLibrary()

	const [user] = useJellifyUser()

	return useInfiniteQuery({
		queryKey: [
			SuggestionQueryKeys.InfiniteArtistSuggestions,
			user?.id,
			library?.musicLibraryId,
		],
		queryFn: ({ pageParam }) =>
			fetchArtistSuggestions(api, user, library?.musicLibraryId, pageParam),
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) =>
			lastPage.length > 0 ? lastPageParam + 1 : undefined,
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		maxPages: 2,
	})
}

export const useSimilarItems = (item: BaseItemDto) => {
	const api = useApi()

	const [library] = useJellifyLibrary()

	const [user] = useJellifyUser()

	return useQuery({
		queryKey: [SuggestionQueryKeys.SimilarItems, library?.musicLibraryId, item.Id],
		queryFn: () =>
			item.Type === BaseItemKind.MusicArtist
				? fetchSimilarArtists(api, user, library?.musicLibraryId, item.Id!)
				: fetchSimilarItems(api, user, library?.musicLibraryId, item.Id!),
		enabled: !isUndefined(library) && !isUndefined(item.Id),
	})
}
