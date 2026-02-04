import { QueryKeys } from '../../../enums/query-keys'
import { BaseItemDto, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client'
import {
	InfiniteData,
	useInfiniteQuery,
	UseInfiniteQueryResult,
	useQuery,
} from '@tanstack/react-query'
import { isUndefined } from 'lodash'
import { fetchArtistAlbums, fetchArtistFeaturedOn, fetchArtists } from './utils/artist'
import { ApiLimits, MaxPages } from '../../../configs/query.config'
import { RefObject, useRef } from 'react'
import flattenInfiniteQueryPages from '../../../utils/query-selectors'
import { useApi, useJellifyLibrary, useJellifyUser } from '../../../stores'
import useLibraryStore from '../../../stores/library'

export const useArtistAlbums = (artist: BaseItemDto) => {
	const api = useApi()
	const [library] = useJellifyLibrary()

	return useQuery({
		queryKey: [QueryKeys.ArtistAlbums, library?.musicLibraryId, artist.Id],
		queryFn: () => fetchArtistAlbums(api, library?.musicLibraryId, artist),
		enabled: !isUndefined(artist.Id),
	})
}

export const useArtistFeaturedOn = (artist: BaseItemDto) => {
	const api = useApi()
	const [library] = useJellifyLibrary()

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
	const api = useApi()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()

	const {
		filters,
		sortBy: librarySortByState,
		sortDescending: librarySortDescendingState,
	} = useLibraryStore()
	const rawArtistSortBy = librarySortByState.artists ?? ItemSortBy.SortName
	// Artists tab only supports sort by name
	const librarySortBy =
		rawArtistSortBy === ItemSortBy.SortName || rawArtistSortBy === ItemSortBy.Name
			? rawArtistSortBy
			: ItemSortBy.SortName
	const sortDescending = librarySortDescendingState.artists ?? false
	const isFavorites = filters.artists.isFavorites

	const artistPageParams = useRef<Set<string>>(new Set<string>())

	const isSortByName =
		librarySortBy === ItemSortBy.Name ||
		librarySortBy === ItemSortBy.SortName ||
		librarySortBy === ItemSortBy.Artist

	// Only add letter sections when sorting by name (for A-Z selector)
	const selectArtists = (data: InfiniteData<BaseItemDto[], unknown>) => {
		if (!isSortByName) return data.pages.flatMap((page) => page)
		return flattenInfiniteQueryPages(data, artistPageParams)
	}

	const artistsInfiniteQuery = useInfiniteQuery({
		queryKey: [
			QueryKeys.InfiniteArtists,
			isFavorites,
			sortDescending,
			library?.musicLibraryId,
			librarySortBy,
		],
		queryFn: ({ pageParam }: { pageParam: number }) =>
			fetchArtists(
				api,
				user,
				library,
				pageParam,
				isFavorites,
				[librarySortBy ?? ItemSortBy.SortName],
				[sortDescending ? SortOrder.Descending : SortOrder.Ascending],
			),
		select: selectArtists,
		maxPages: MaxPages.Library,
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
