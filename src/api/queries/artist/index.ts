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
import fetchArtistTracks from './utils/tracks'
import { ApiLimits } from '../query.config'
import { RefObject, useCallback, useRef } from 'react'
import { useLibrarySortAndFilterContext } from '../../../providers/Library'
import flattenInfiniteQueryPages from '../../../utils/query-selectors'
import { useApi, useJellifyLibrary, useJellifyUser } from '../../../stores'

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

export const useArtistTracks = (
	artist: BaseItemDto,
	isFavorite: boolean,
	sortDescending: boolean,
	sortBy: ItemSortBy = ItemSortBy.SortName,
) => {
	const api = useApi()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()

	const trackPageParams = useRef<Set<string>>(new Set<string>())

	const selectTracks = useCallback(
		(data: InfiniteData<BaseItemDto[], unknown>) =>
			flattenInfiniteQueryPages(data, trackPageParams),
		[],
	)

	return useInfiniteQuery({
		queryKey: [
			QueryKeys.ArtistTracks,
			library?.musicLibraryId,
			artist.Id,
			isFavorite,
			sortDescending,
			sortBy,
		],
		queryFn: ({ pageParam }) =>
			fetchArtistTracks(
				api,
				user,
				library,
				artist,
				pageParam,
				isFavorite ? true : undefined,
				sortBy,
				sortDescending ? SortOrder.Descending : SortOrder.Ascending,
			),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam) => {
			return lastPage.length === ApiLimits.Library ? lastPageParam + 1 : undefined
		},
		select: selectTracks,
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
