import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { SuggestionQueryKeys } from './keys'
import { fetchSearchSuggestions } from './utils/suggestions'
import { getUser, useJellifyLibrary } from '../../../stores'
import { isUndefined } from 'lodash'
import fetchSimilarArtists, { fetchSimilarItems } from './utils/similar'
import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import { ONE_DAY } from '../../../constants/query-client'
import { DiscoverAlbumsQuery, DiscoverArtistsQuery } from './queries'

export const useSearchSuggestions = () => {
	const [library] = useJellifyLibrary()

	const user = getUser()

	return useQuery({
		queryKey: [SuggestionQueryKeys.SearchSuggestions, library?.musicLibraryId],
		queryFn: () => fetchSearchSuggestions(user, library?.musicLibraryId),
		enabled: !isUndefined(library),
	})
}

export const useDiscoverArtists = () => {
	const [library] = useJellifyLibrary()

	const user = getUser()

	return useInfiniteQuery(DiscoverArtistsQuery(user, library))
}

export const useDiscoverAlbums = () => {
	const [library] = useJellifyLibrary()

	const user = getUser()

	return useInfiniteQuery(DiscoverAlbumsQuery(user, library))
}

export const useSimilarItems = (item: BaseItemDto) => {
	const user = getUser()

	return useQuery({
		queryKey: [SuggestionQueryKeys.SimilarItems, item.Id],
		queryFn: () =>
			item.Type === BaseItemKind.MusicArtist
				? fetchSimilarArtists(user, item.Id!)
				: fetchSimilarItems(user, item.Id!),
		enabled: !isUndefined(item.Id),
		staleTime: ONE_DAY,
	})
}
