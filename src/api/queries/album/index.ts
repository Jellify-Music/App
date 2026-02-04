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
import { RefObject, useRef, useState } from 'react'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import flattenInfiniteQueryPages from '../../../utils/query-selectors'
import { ApiLimits, MaxPages } from '../../../configs/query.config'
import { fetchRecentlyAdded } from '../recents/utils'
import { queryClient } from '../../../constants/query-client'
import { getApi, getUser, useJellifyLibrary } from '../../../stores'
import useLibraryStore from '../../../stores/library'
import { fetchAlbumDiscs } from '../item'
import { Api } from '@jellyfin/sdk/lib/api'
import { AlbumDiscsQueryKey } from './keys'

const useAlbums: () => [
	RefObject<Set<string>>,
	UseInfiniteQueryResult<(string | number | BaseItemDto)[]>,
] = () => {
	const api = getApi()
	const user = getUser()
	const [library] = useJellifyLibrary()

	const {
		filters,
		sortBy: librarySortByState,
		sortDescending: librarySortDescendingState,
	} = useLibraryStore()
	const rawAlbumSortBy = librarySortByState.albums ?? ItemSortBy.SortName
	const albumSortByOptions = [
		ItemSortBy.Name,
		ItemSortBy.SortName,
		ItemSortBy.Album,
		ItemSortBy.Artist,
		ItemSortBy.PlayCount,
		ItemSortBy.DateCreated,
		ItemSortBy.PremiereDate,
	] as ItemSortBy[]
	const librarySortBy = albumSortByOptions.includes(rawAlbumSortBy as ItemSortBy)
		? (rawAlbumSortBy as ItemSortBy)
		: ItemSortBy.Album
	const sortDescending = librarySortDescendingState.albums ?? false
	const isFavorites = filters.albums.isFavorites

	const albumPageParams = useRef<Set<string>>(new Set<string>())

	// Add letter sections when sorting by name/album/artist (for A-Z selector)
	const isSortByLetter =
		librarySortBy === ItemSortBy.Name ||
		librarySortBy === ItemSortBy.SortName ||
		librarySortBy === ItemSortBy.Album ||
		librarySortBy === ItemSortBy.Artist

	const selectAlbums = (data: InfiniteData<BaseItemDto[], unknown>) => {
		if (!isSortByLetter) return data.pages.flatMap((page) => page)
		return flattenInfiniteQueryPages(data, albumPageParams, {
			sortBy: librarySortBy === ItemSortBy.Artist ? ItemSortBy.Artist : undefined,
		})
	}

	const albumsInfiniteQuery = useInfiniteQuery({
		queryKey: [
			QueryKeys.InfiniteAlbums,
			isFavorites,
			library?.musicLibraryId,
			librarySortBy,
			sortDescending,
		],
		queryFn: ({ pageParam }) =>
			fetchAlbums(
				api,
				user,
				library,
				pageParam,
				isFavorites,
				[librarySortBy ?? ItemSortBy.SortName],
				[sortDescending ? SortOrder.Descending : SortOrder.Ascending],
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
	const api = getApi()
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

export interface LetterAnchoredAlbumsResult {
	data: (string | BaseItemDto)[]
	letters: Set<string>
	anchorLetter: string | null
	setAnchorLetter: (letter: string | null) => void
	fetchNextPage: () => void
	hasNextPage: boolean
	fetchPreviousPage: () => void
	hasPreviousPage: boolean
	isFetching: boolean
	isPending: boolean
	refetch: () => void
	anchorIndex: number
}

export const useLetterAnchoredAlbums = (): LetterAnchoredAlbumsResult => {
	const api = getApi()
	const user = getUser()
	const [library] = useJellifyLibrary()

	const isFavorites = useLibraryStore((state) => state.filters.albums.isFavorites)

	const [anchorLetter, setAnchorLetter] = useState<string | null>(null)

	const forwardQuery = useInfiniteQuery({
		queryKey: [
			QueryKeys.InfiniteAlbums,
			'forward',
			anchorLetter,
			isFavorites,
			library?.musicLibraryId,
		],
		queryFn: ({ pageParam }: { pageParam: number }) =>
			fetchAlbums(
				api,
				user,
				library,
				pageParam,
				isFavorites,
				[ItemSortBy.SortName],
				[SortOrder.Ascending],
				anchorLetter ? { nameStartsWithOrGreater: anchorLetter } : undefined,
			),
		maxPages: MaxPages.Library,
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam) => {
			return lastPage.length === ApiLimits.Library ? lastPageParam + 1 : undefined
		},
		staleTime: Infinity,
	})

	const backwardQuery = useInfiniteQuery({
		queryKey: [
			QueryKeys.InfiniteAlbums,
			'backward',
			anchorLetter,
			isFavorites,
			library?.musicLibraryId,
		],
		queryFn: ({ pageParam }: { pageParam: number }) =>
			fetchAlbums(
				api,
				user,
				library,
				pageParam,
				isFavorites,
				[ItemSortBy.SortName],
				[SortOrder.Descending],
				{ nameLessThan: anchorLetter! },
			),
		enabled: anchorLetter !== null,
		maxPages: MaxPages.Library,
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam) => {
			return lastPage.length === ApiLimits.Library ? lastPageParam + 1 : undefined
		},
		staleTime: Infinity,
	})

	const seenLetters = new Set<string>()
	const mergedData: (string | BaseItemDto)[] = []

	const backwardItems = backwardQuery.data?.pages.flat().reverse() ?? []
	backwardItems.forEach((item: BaseItemDto) => {
		const rawLetter = item.SortName?.charAt(0).toUpperCase() ?? '#'
		const letter = rawLetter.match(/[A-Z]/) ? rawLetter : '#'

		if (!seenLetters.has(letter)) {
			seenLetters.add(letter)
			mergedData.push(letter)
		}
		mergedData.push(item)
	})

	const anchorIndex = mergedData.length

	const forwardItems = forwardQuery.data?.pages.flat() ?? []
	forwardItems.forEach((item: BaseItemDto) => {
		const rawLetter = item.SortName?.charAt(0).toUpperCase() ?? '#'
		const letter = rawLetter.match(/[A-Z]/) ? rawLetter : '#'

		if (!seenLetters.has(letter)) {
			seenLetters.add(letter)
			mergedData.push(letter)
		}
		mergedData.push(item)
	})

	const handleSetAnchorLetter = (letter: string | null) => {
		if (letter === '#') {
			setAnchorLetter(null)
		} else {
			setAnchorLetter(letter?.toUpperCase() ?? null)
		}
	}

	const refetch = () => {
		forwardQuery.refetch()
		if (anchorLetter) backwardQuery.refetch()
	}

	return {
		data: mergedData,
		letters: seenLetters,
		anchorLetter,
		setAnchorLetter: handleSetAnchorLetter,
		fetchNextPage: forwardQuery.fetchNextPage,
		hasNextPage: forwardQuery.hasNextPage ?? false,
		fetchPreviousPage: backwardQuery.fetchNextPage,
		hasPreviousPage: (anchorLetter !== null && backwardQuery.hasNextPage) ?? false,
		isFetching: forwardQuery.isFetching || backwardQuery.isFetching,
		isPending: forwardQuery.isPending,
		refetch,
		anchorIndex,
	}
}
