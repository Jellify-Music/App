import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { SuggestionQueryKeys } from './keys'
import { fetchSearchSuggestions } from './utils/suggestions'
import { useJellifyLibrary } from '../../../stores/auth'
import { getUser } from '../../../stores/auth/utils'
import { isUndefined } from 'lodash'
import fetchSimilarArtists, { fetchSimilarItems } from './utils/similar'
import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import { QueryAges } from '../../../constants/durations'
import { DiscoverAlbumsQuery, DiscoverArtistsQuery } from './queries'
import { MusicLibraryQueryKey } from '../libraries/keys'

export const useSearchSuggestions = () => {
	const [library] = useJellifyLibrary()

	const user = getUser()

	return useQuery({
		queryKey: [
			SuggestionQueryKeys.SearchSuggestions,
			MusicLibraryQueryKey(library?.musicLibraryId),
		],
		queryFn: () => fetchSearchSuggestions(user, library?.musicLibraryId),
		enabled: !isUndefined(user),
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
		queryFn: ({ signal }) =>
			item.Type === BaseItemKind.MusicArtist
				? fetchSimilarArtists(user, item.Id!, undefined, signal)
				: fetchSimilarItems(user, item.Id!, undefined, signal),
		enabled: !isUndefined(item.Id),
		staleTime: QueryAges.OneDay,
		gcTime: QueryAges.OneWeek,
	})
}
