import { QueryKeys } from '../../../enums/query-keys'
import {
	InfiniteData,
	useInfiniteQuery,
	UseInfiniteQueryResult,
	useQuery,
} from '@tanstack/react-query'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order'
import { fetchAlbums } from './utils/album'
import { RefObject, useRef } from 'react'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import flattenInfiniteQueryPages from '../../../utils/query-selectors'
import { ApiLimits, MaxPages } from '../../../configs/query.config'
import { fetchRecentlyAdded } from '../recents/utils'
import { queryClient } from '../../../constants/query-client'
import { getApi, useApi, useJellifyLibrary, useJellifyUser } from '../../../stores'
import useLibraryStore from '../../../stores/library'
import { fetchAlbumDiscs } from '../item'
import { Api } from '@jellyfin/sdk/lib/api'
import { AlbumDiscsQueryKey } from './keys'

const useAlbums: () => [
	RefObject<Set<string>>,
	UseInfiniteQueryResult<(string | number | BaseItemDto)[]>,
] = () => {
	const api = useApi()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()

	const isFavorites = useLibraryStore((state) => state.isFavorites)

	const albumPageParams = useRef<Set<string>>(new Set<string>())

	// Memize the expensive albums select function
	const selectAlbums = (data: InfiniteData<BaseItemDto[], unknown>) =>
		flattenInfiniteQueryPages(data, albumPageParams)

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
		maxPages: MaxPages.Library,
		getNextPageParam: (lastPage, allPages, lastPageParam) => {
			return lastPage.length === ApiLimits.Library ? lastPageParam + 1 : undefined
		},
		getPreviousPageParam: (firstPage, allPages, firstPageParam) => {
			return firstPageParam === 0 ? null : firstPageParam - 1
		},
	})

	return [albumPageParams, albumsInfiniteQuery]
}

export default useAlbums

export const useRecentlyAddedAlbums = () => {
	const api = useApi()
	const [library] = useJellifyLibrary()

	return useInfiniteQuery({
		queryKey: [QueryKeys.RecentlyAddedAlbums, library?.musicLibraryId],
		queryFn: ({ pageParam }) => fetchRecentlyAdded(api, library, pageParam),
		select: (data) => data.pages.flatMap((page) => page),
		getNextPageParam: (lastPage, allPages, lastPageParam) =>
			lastPage.length > 0 ? lastPageParam + 1 : undefined,
		initialPageParam: 0,
	})
}

export const useRefetchRecentlyAdded: () => () => void = () => {
	const [library] = useJellifyLibrary()

	return () =>
		queryClient.invalidateQueries({
			queryKey: [QueryKeys.RecentlyAddedAlbums, library?.musicLibraryId],
		})
}

export const useAlbumDiscs = (album: BaseItemDto) => {
	const api = getApi()

	return useQuery(AlbumDiscsQuery(api, album))
}

export const AlbumDiscsQuery = (api: Api | undefined, album: BaseItemDto) => ({
	queryKey: AlbumDiscsQueryKey(album),
	queryFn: () => fetchAlbumDiscs(api, album),
})
