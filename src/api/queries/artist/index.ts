import { QueryKeys } from '../../../enums/query-keys'
import { BaseItemDto, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client'
import {
	InfiniteData,
	useInfiniteQuery,
	UseInfiniteQueryResult,
	useQuery,
} from '@tanstack/react-query'
import { isString, isUndefined } from 'lodash'
import { fetchArtistAlbums, fetchArtistFeaturedOn, fetchArtists } from './utils/artist'
import { useJellifyContext } from '../../../providers'
import { ApiLimits } from '../query.config'
import { RefObject, useCallback, useRef } from 'react'
import { useLibrarySortAndFilterContext } from '../../../providers/Library'
import flattenInfiniteQueryPages from '../../../utils/query-selectors'

export const useArtistAlbums = (artist: BaseItemDto) => {
	const { api, library } = useJellifyContext()

	return useQuery({
		queryKey: [QueryKeys.ArtistAlbums, library?.musicLibraryId, artist.Id],
		queryFn: () => fetchArtistAlbums(api, library?.musicLibraryId, artist),
		enabled: !isUndefined(artist.Id),
	})
}

export const useArtistFeaturedOn = (artist: BaseItemDto) => {
	const { api, library } = useJellifyContext()

	return useQuery({
		queryKey: [QueryKeys.ArtistFeaturedOn, library?.musicLibraryId, artist.Id],
		queryFn: () => fetchArtistFeaturedOn(api, library?.musicLibraryId, artist),
		enabled: !isUndefined(artist.Id),
	})
}

export const useAlbumArtists: () => [
	RefObject<Set<string>>,
	UseInfiniteQueryResult<(string | number | BaseItemDto)[], Error>,
] = () => {
	const { api, user, library } = useJellifyContext()

	const { isFavorites, sortDescending } = useLibrarySortAndFilterContext()

	const artistPageParams = useRef<Set<string>>(new Set<string>())

	// Memoize the expensive artists select function
	const selectArtists = useCallback(
		(data: InfiniteData<BaseItemDto[], unknown>) =>
			flattenInfiniteQueryPages(data, artistPageParams),
		[],
	)

	const artistsInfiniteQuery = useInfiniteQuery({
		queryKey: [QueryKeys.InfiniteArtists, isFavorites, sortDescending, library?.musicLibraryId],
		queryFn: ({ pageParam }: { pageParam: number }) =>
			fetchArtists(
				api,
				user,
				library,
				pageParam,
				isFavorites,
				[ItemSortBy.SortName],
				[sortDescending ? SortOrder.Descending : SortOrder.Ascending],
			),
		select: selectArtists,
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			return lastPage.length === ApiLimits.Library ? lastPageParam + 1 : undefined
		},
		getPreviousPageParam: (firstPage, allPages, firstPageParam, allPageParams) => {
			return firstPageParam === 0 ? null : firstPageParam - 1
		},
	})

	return [artistPageParams, artistsInfiniteQuery]
}
