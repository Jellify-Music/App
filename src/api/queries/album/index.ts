import { QueryKeys } from '../../../enums/query-keys'
import { InfiniteData, useInfiniteQuery, UseInfiniteQueryResult } from '@tanstack/react-query'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order'
import { fetchAlbums } from './utils/album'
import { RefObject, useCallback, useRef } from 'react'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import flattenInfiniteQueryPages from '../../../utils/query-selectors'
import { ApiLimits, MaxPages } from '../../../configs/query.config'
import { fetchRecentlyAdded } from '../recents/utils'
import { queryClient } from '../../../constants/query-client'
import {
	useApi,
	useJellifyLibrary,
	useJellifyUser,
	useJellifyServer,
	useAdapter,
} from '../../../stores'
import useLibraryStore from '../../../stores/library'
import { unifiedAlbumsToBaseItems } from '../../../utils/unified-conversions'

const useAlbums: () => [
	RefObject<Set<string>>,
	UseInfiniteQueryResult<(string | number | BaseItemDto)[]>,
] = () => {
	const api = useApi()
	const adapter = useAdapter()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()
	const [server] = useJellifyServer()

	const isNavidrome = server?.backend === 'navidrome'
	const isJellyfin = !isNavidrome

	const isFavorites = useLibraryStore((state) => state.isFavorites)

	const albumPageParams = useRef<Set<string>>(new Set<string>())

	// Memize the expensive albums select function
	const selectAlbums = useCallback(
		(data: InfiniteData<BaseItemDto[], unknown>) =>
			flattenInfiniteQueryPages(data, albumPageParams),
		[],
	)

	const albumsInfiniteQuery = useInfiniteQuery({
		queryKey: [QueryKeys.InfiniteAlbums, isFavorites, library?.musicLibraryId, isNavidrome],
		queryFn: async ({ pageParam }) => {
			// For Navidrome, use the adapter
			if (isNavidrome && adapter) {
				const unifiedAlbums = await adapter.getAlbums({
					type: 'alphabetical',
					limit: ApiLimits.Library,
					offset: pageParam * ApiLimits.Library,
				})
				return unifiedAlbumsToBaseItems(unifiedAlbums)
			}

			// For Jellyfin, use the existing fetch
			return fetchAlbums(
				api,
				user,
				library,
				pageParam,
				isFavorites,
				[ItemSortBy.SortName],
				[SortOrder.Ascending],
			)
		},
		initialPageParam: 0,
		select: selectAlbums,
		maxPages: MaxPages.Library,
		getNextPageParam: (lastPage, allPages, lastPageParam) => {
			return lastPage.length === ApiLimits.Library ? lastPageParam + 1 : undefined
		},
		getPreviousPageParam: (firstPage, allPages, firstPageParam) => {
			return firstPageParam === 0 ? null : firstPageParam - 1
		},
		// Enable for both backends now
		enabled: !!adapter || isJellyfin,
	})

	return [albumPageParams, albumsInfiniteQuery]
}

export default useAlbums

export const useRecentlyAddedAlbums = () => {
	const api = useApi()
	const [library] = useJellifyLibrary()
	const [server] = useJellifyServer()

	// Only run for Jellyfin backend
	const isJellyfin = server?.backend !== 'navidrome'

	return useInfiniteQuery({
		queryKey: [QueryKeys.RecentlyAddedAlbums, library?.musicLibraryId],
		queryFn: ({ pageParam }) => fetchRecentlyAdded(api, library, pageParam),
		select: (data) => data.pages.flatMap((page) => page),
		getNextPageParam: (lastPage, allPages, lastPageParam) =>
			lastPage.length > 0 ? lastPageParam + 1 : undefined,
		initialPageParam: 0,
		// Only run for Jellyfin backend
		enabled: isJellyfin,
	})
}

export const useRefetchRecentlyAdded: () => () => void = () => {
	const [library] = useJellifyLibrary()

	return () =>
		queryClient.invalidateQueries({
			queryKey: [QueryKeys.RecentlyAddedAlbums, library?.musicLibraryId],
		})
}
