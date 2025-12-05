import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { SuggestionQueryKeys } from './keys'
import { fetchArtistSuggestions, fetchSearchSuggestions } from './utils/suggestions'
import { useApi, useJellifyLibrary, useJellifyUser } from '../../../stores'
import { isUndefined } from 'lodash'

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
