import { useLibrarySortAndFilterContext } from '../../../providers/Library'
import { QueryKeys } from '../../../enums/query-keys'
import { useJellifyContext } from '../../../providers'
import { InfiniteData, useInfiniteQuery, UseInfiniteQueryResult } from '@tanstack/react-query'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order'
import { fetchAlbums } from './utils/album'
import { RefObject, useCallback, useRef } from 'react'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import flattenInfiniteQueryPages from '../../../utils/query-selectors'
import { ApiLimits } from '../query.config'
import { fetchRecentlyAdded } from '../recents'
import { queryClient } from '../../../constants/query-client'

const useAlbums: () => [
	RefObject<Set<string>>,
	UseInfiniteQueryResult<(string | number | BaseItemDto)[]>,
] = () => {
	const { api, user, library } = useJellifyContext()

	const { isFavorites, sortDescending } = useLibrarySortAndFilterContext()

	const albumPageParams = useRef<Set<string>>(new Set<string>())

	// Memize the expensive albums select function
	const selectAlbums = useCallback(
		(data: InfiniteData<BaseItemDto[], unknown>) =>
			flattenInfiniteQueryPages(data, albumPageParams),
		[],
	)

	const albumsInfiniteQuery = useInfiniteQuery({
		queryKey: [QueryKeys.InfiniteAlbums, isFavorites, library?.musicLibraryId],
		queryFn: ({ pageParam }) =>
			fetchAlbums(
				api,
				user,
				library,
				pageParam,
				isFavorites,
				[ItemSortBy.SortName],
				[SortOrder.Ascending],
			),
		initialPageParam: 0,
		select: selectAlbums,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			return lastPage.length === ApiLimits.Library ? lastPageParam + 1 : undefined
		},
		getPreviousPageParam: (firstPage, allPages, firstPageParam, allPageParams) => {
			return firstPageParam === 0 ? null : firstPageParam - 1
		},
	})

	return [albumPageParams, albumsInfiniteQuery]
}

export default useAlbums

export const useRecentlyAddedAlbums = () => {
	const { api, user, library } = useJellifyContext()

	return useInfiniteQuery({
		queryKey: [QueryKeys.RecentlyAddedAlbums, library?.musicLibraryId],
		queryFn: ({ pageParam }) => fetchRecentlyAdded(api, library, pageParam),
		select: (data) => data.pages.flatMap((page) => page),
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) =>
			lastPage.length > 0 ? lastPageParam + 1 : undefined,
		initialPageParam: 0,
	})
}

export const useRefetchRecentlyAdded: () => () => void = () => {
	const { library } = useJellifyContext()

	return () =>
		queryClient.invalidateQueries({
			queryKey: [QueryKeys.RecentlyAddedAlbums, library?.musicLibraryId],
		})
}
