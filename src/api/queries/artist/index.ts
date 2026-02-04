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
import { RefObject, useCallback, useMemo, useRef, useState } from 'react'
import flattenInfiniteQueryPages, { flattenWithLetterHeaders } from '../../../utils/query-selectors'
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

export interface LetterAnchoredArtistsResult {
	/** The merged data with letter headers, ready for FlashList */
	data: (string | BaseItemDto)[]
	/** Set of letters present in the data */
	letters: Set<string>
	/** Current anchor letter (null = start from beginning) */
	anchorLetter: string | null
	/** Set anchor letter - triggers instant jump */
	setAnchorLetter: (letter: string | null) => void
	/** Fetch next page (forward direction) */
	fetchNextPage: () => void
	/** Whether there are more pages forward */
	hasNextPage: boolean
	/** Fetch previous page (backward direction) */
	fetchPreviousPage: () => void
	/** Whether there are more pages backward */
	hasPreviousPage: boolean
	/** Whether any query is currently fetching */
	isFetching: boolean
	/** Whether the initial load is pending */
	isPending: boolean
	/** Refetch both queries */
	refetch: () => void
	/** Index where forward data starts (for scroll positioning) */
	anchorIndex: number
}

/**
 * Hook for letter-anchored bidirectional artist navigation.
 * Instantly jumps to a letter using NameStartsWithOrGreater,
 * and supports scrolling backward using NameLessThan.
 */
export const useLetterAnchoredArtists = (): LetterAnchoredArtistsResult => {
	const api = useApi()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()

	const { filters, sortDescending } = useLibraryStore()
	const isFavorites = filters.artists.isFavorites

	// Anchor letter state - null means start from beginning
	const [anchorLetter, setAnchorLetter] = useState<string | null>(null)

	// Forward query: fetches from anchor letter onwards
	const forwardQuery = useInfiniteQuery({
		queryKey: [
			QueryKeys.InfiniteArtists,
			'forward',
			anchorLetter,
			isFavorites,
			sortDescending,
			library?.musicLibraryId,
		],
		queryFn: ({ pageParam }: { pageParam: number }) =>
			fetchArtists(
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

	// Backward query: fetches items before anchor letter (only when anchor is set)
	const backwardQuery = useInfiniteQuery({
		queryKey: [
			QueryKeys.InfiniteArtists,
			'backward',
			anchorLetter,
			isFavorites,
			sortDescending,
			library?.musicLibraryId,
		],
		queryFn: ({ pageParam }: { pageParam: number }) =>
			fetchArtists(
				api,
				user,
				library,
				pageParam,
				isFavorites,
				[ItemSortBy.SortName],
				[SortOrder.Descending], // Descending to get L, K, J... order
				{ nameLessThan: anchorLetter! },
			),
		enabled: anchorLetter !== null, // Only fetch when we have an anchor
		maxPages: MaxPages.Library,
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam) => {
			return lastPage.length === ApiLimits.Library ? lastPageParam + 1 : undefined
		},
		staleTime: Infinity,
	})

	// Merge backward (reversed) + forward data with letter headers
	const { data, letters, anchorIndex } = useMemo(() => {
		const seenLetters = new Set<string>()
		const result: (string | BaseItemDto)[] = []

		// Process backward data (reverse it to get correct order: A, B, C... not L, K, J...)
		const backwardItems = backwardQuery.data?.pages.flat().reverse() ?? []
		backwardItems.forEach((item: BaseItemDto) => {
			const rawLetter = item.SortName?.charAt(0).toUpperCase() ?? '#'
			const letter = rawLetter.match(/[A-Z]/) ? rawLetter : '#'

			if (!seenLetters.has(letter)) {
				seenLetters.add(letter)
				result.push(letter)
			}
			result.push(item)
		})

		// Track where forward data starts
		const anchorIdx = result.length

		// Process forward data
		const forwardItems = forwardQuery.data?.pages.flat() ?? []
		forwardItems.forEach((item: BaseItemDto) => {
			const rawLetter = item.SortName?.charAt(0).toUpperCase() ?? '#'
			const letter = rawLetter.match(/[A-Z]/) ? rawLetter : '#'

			if (!seenLetters.has(letter)) {
				seenLetters.add(letter)
				result.push(letter)
			}
			result.push(item)
		})

		return { data: result, letters: seenLetters, anchorIndex: anchorIdx }
	}, [forwardQuery.data, backwardQuery.data])

	const handleSetAnchorLetter = useCallback((letter: string | null) => {
		// '#' means items before 'A' (numbers/symbols)
		if (letter === '#') {
			setAnchorLetter(null) // Start from beginning
		} else {
			setAnchorLetter(letter?.toUpperCase() ?? null)
		}
	}, [])

	const refetch = useCallback(() => {
		forwardQuery.refetch()
		if (anchorLetter) backwardQuery.refetch()
	}, [forwardQuery, backwardQuery, anchorLetter])

	return {
		data,
		letters,
		anchorLetter,
		setAnchorLetter: handleSetAnchorLetter,
		fetchNextPage: forwardQuery.fetchNextPage,
		hasNextPage: forwardQuery.hasNextPage ?? false,
		fetchPreviousPage: backwardQuery.fetchNextPage, // Note: "next" in backward direction
		hasPreviousPage: (anchorLetter !== null && backwardQuery.hasNextPage) ?? false,
		isFetching: forwardQuery.isFetching || backwardQuery.isFetching,
		isPending: forwardQuery.isPending,
		refetch,
		anchorIndex,
	}
}
