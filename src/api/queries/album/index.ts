import { QueryKeys } from '../../../enums/query-keys'
import { InfiniteData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order'
import { fetchAlbums } from './utils/album'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import flattenInfiniteQueryPages from '../../../utils/query-selectors'
import { MaxPages } from '../../../configs/querying/index.config'
import { queryClient } from '../../../constants/query-client'
import { getApi, getUser } from '../../../stores/auth/utils'
import { useJellifyLibrary } from '../../../stores/auth'
import useLibraryStore from '../../../stores/library'
import { fetchAlbumDiscs } from '../item'
import { Api } from '@jellyfin/sdk/lib/api'
import { AlbumDiscsQueryKey } from './keys'
import { AlbumQuery, RecentlyAddedQuery } from './queries'
import { InfiniteSectionListPageParam } from '../../types/page-param'
import { createLetterPageParamFns } from '../../utils/page-params'

const albumSortByOptions = [
	ItemSortBy.Name,
	ItemSortBy.SortName,
	ItemSortBy.Album,
	ItemSortBy.Artist,
	ItemSortBy.PlayCount,
	ItemSortBy.DateCreated,
	ItemSortBy.PremiereDate,
] as ItemSortBy[]

export const useAlbum = (album: BaseItemDto) => useQuery(AlbumQuery(album))

const useAlbums = () => {
	const api = getApi()
	const user = getUser()
	const [library] = useJellifyLibrary()

	const {
		filters,
		sortBy: librarySortByState,
		sortDescending: librarySortDescendingState,
	} = useLibraryStore()
	const rawAlbumSortBy = librarySortByState.albums ?? ItemSortBy.SortName

	const librarySortBy = albumSortByOptions.includes(rawAlbumSortBy)
		? (rawAlbumSortBy as ItemSortBy)
		: ItemSortBy.Album
	const sortDescending = librarySortDescendingState.albums ?? false
	const isFavorites = filters.albums.isFavorites
	const yearMin = filters.albums.yearMin
	const yearMax = filters.albums.yearMax

	// Add letter sections when sorting by name/album/artist (for A-Z selector)
	const isSortByLetter =
		librarySortBy === ItemSortBy.Name ||
		librarySortBy === ItemSortBy.SortName ||
		librarySortBy === ItemSortBy.Album

	const selectAlbums = (data: InfiniteData<BaseItemDto[], unknown>) => {
		if (!isSortByLetter) return data.pages.flatMap((page) => page)
		return flattenInfiniteQueryPages(data)
	}

	const queryKey = [
		QueryKeys.InfiniteAlbums,
		isFavorites,
		library?.musicLibraryId,
		librarySortBy,
		sortDescending,
		yearMin,
		yearMax,
	]

	const sortBy = [librarySortBy ?? ItemSortBy.SortName]
	const sortOrder = [sortDescending ? SortOrder.Descending : SortOrder.Ascending]

	const { getNextPageParam, getPreviousPageParam } = createLetterPageParamFns(sortDescending)

	/**
	 * Jumps the albums list directly to {@link letter} with a single `nameStartsWith`/
	 * `nameLessThan` + `limit`-bounded request scoped to that letter, then seeds the query cache
	 * with that page - no fetching (or paginating through) albums outside the target letter.
	 */
	const jumpToLetter = async (letter: string, letterReverseOrder: boolean): Promise<boolean> => {
		if (!isSortByLetter || !api || !user || !library) return false

		try {
			const pageParam: InfiniteSectionListPageParam = {
				letter: letter.toUpperCase(),
				index: 0,
			}

			const items = await fetchAlbums(
				api,
				user,
				library,
				pageParam,
				isFavorites,
				sortBy,
				[letterReverseOrder ? SortOrder.Descending : SortOrder.Ascending],
				yearMin,
				yearMax,
			)

			// A jump seeks to a new spot in the list, so it replaces the cache with a single page
			// rather than merging - old pages aren't adjacent to it, so keeping them around would
			// just leave gaps getNextPageParam/getPreviousPageParam can't page across
			queryClient.setQueryData<InfiniteData<BaseItemDto[], InfiniteSectionListPageParam>>(
				queryKey,
				{
					pages: [items],
					pageParams: [pageParam],
				},
			)
			return true
		} catch {
			return false
		}
	}

	return {
		...useInfiniteQuery({
			queryKey,
			queryFn: ({ pageParam, signal }) =>
				fetchAlbums(
					api,
					user,
					library,
					pageParam,
					isFavorites,
					sortBy,
					sortOrder,
					yearMin,
					yearMax,
					signal,
				),
			initialPageParam: {
				index: 0,
				letter: '#',
			} as InfiniteSectionListPageParam,
			select: selectAlbums,
			maxPages: MaxPages.Library,
			getNextPageParam,
			getPreviousPageParam,
		}),
		jumpToLetter,
	}
}

export default useAlbums

export const useRecentlyAddedAlbums = () => {
	const api = getApi()
	const user = getUser()

	const [library] = useJellifyLibrary()

	return useInfiniteQuery(RecentlyAddedQuery(api, user, library))
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

export const ensureAlbumDiscsQuery = async (album: BaseItemDto) =>
	await queryClient.ensureQueryData(AlbumDiscsQuery(getApi(), album))

const AlbumDiscsQuery = (api: Api | undefined, album: BaseItemDto) => ({
	queryKey: AlbumDiscsQueryKey(album),
	queryFn: () => fetchAlbumDiscs(api, album),
})
