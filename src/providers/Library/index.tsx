import { QueryKeys } from '../../enums/query-keys'
import { BaseItemDto, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client/models'
import { useJellifyContext } from '..'
import { fetchArtists } from '../../api/queries/artist'
import { RefObject, useMemo, useRef } from 'react'
import QueryConfig, { ApiLimits } from '../../api/queries/query.config'
import { fetchTracks } from '../../api/queries/tracks'
import { fetchAlbums } from '../../api/queries/album'
import { useLibrarySortAndFilterContext } from './sorting-filtering'
import { fetchUserPlaylists } from '../../api/queries/playlists'
import Artists from '../../components/Artists/component'
import { createContext, useContextSelector } from 'use-context-selector'
import { isString } from 'lodash'
import { useCallback } from 'react'
import {
	InfiniteData,
	InfiniteQueryObserverResult,
	useInfiniteQuery,
	UseInfiniteQueryResult,
} from '@tanstack/react-query'

export const alphabet = '#abcdefghijklmnopqrstuvwxyz'.split('')

interface LibraryContext {
	artistsInfiniteQuery: UseInfiniteQueryResult<(string | number | BaseItemDto)[], Error>
	albumsInfiniteQuery: UseInfiniteQueryResult<(string | number | BaseItemDto)[], Error>
	tracksInfiniteQuery: UseInfiniteQueryResult<(string | number | BaseItemDto)[], Error>
	// genres: BaseItemDto[] | undefined
	playlistsInfiniteQuery: UseInfiniteQueryResult<BaseItemDto[], Error>

	artistPageParams: RefObject<Set<string>>
	albumPageParams: RefObject<string[]>
}

type LibraryPage = {
	title: string
	data: BaseItemDto[]
}

const LibraryContextInitializer = () => {
	const { api, user, library } = useJellifyContext()

	const { sortDescending, isFavorites } = useLibrarySortAndFilterContext()

	const artistPageParams = useRef<Set<string>>(new Set<string>())

	const albumPageParams = useRef<string[]>([])

	// Memoize the expensive artists select function
	const selectArtists = useCallback((data: InfiniteData<BaseItemDto[], unknown>) => {
		/**
		 * A flattened array of all artists derived from the infinite query
		 */
		const flattenedArtistPages = data.pages.flatMap((page) => page)

		/**
		 * A set of letters we've seen so we can add them to the alphabetical selector
		 */
		const seenLetters = new Set<string>()

		/**
		 * The final array that will be provided to and rendered by the {@link Artists} component
		 */
		const flashArtistList: (string | number | BaseItemDto)[] = []

		flattenedArtistPages.forEach((artist: BaseItemDto) => {
			const rawLetter = isString(artist.SortName)
				? artist.SortName.trim().charAt(0).toUpperCase()
				: '#'

			/**
			 * An alpha character or a hash if the artist's name doesn't start with a letter
			 */
			const letter = rawLetter.match(/[A-Z]/) ? rawLetter : '#'

			if (!seenLetters.has(letter)) {
				seenLetters.add(letter)
				flashArtistList.push(letter)
			}

			flashArtistList.push(artist)
		})

		artistPageParams.current = seenLetters

		return flashArtistList
	}, [])

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

	const tracksInfiniteQuery = useInfiniteQuery({
		queryKey: [QueryKeys.AllTracks, isFavorites, sortDescending, library?.musicLibraryId],
		queryFn: ({ pageParam }) =>
			fetchTracks(
				api,
				user,
				library,
				pageParam,
				isFavorites,
				ItemSortBy.SortName,
				sortDescending ? SortOrder.Descending : SortOrder.Ascending,
			),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			console.debug(`Tracks last page length: ${lastPage.length}`)
			return lastPage.length === QueryConfig.limits.library * 2
				? lastPageParam + 1
				: undefined
		},
		select: selectArtists,
	})

	const albumsInfiniteQuery = useInfiniteQuery({
		queryKey: [QueryKeys.AllAlbumsAlphabetical, isFavorites, library?.musicLibraryId],
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
		initialPageParam: alphabet[0],
		select: (data) => data.pages.flatMap((page) => [page.title, ...page.data]),
		maxPages: alphabet.length,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			console.debug(`Albums last page length: ${lastPage.data.length}`)
			if (lastPageParam !== alphabet[alphabet.length - 1]) {
				albumPageParams.current = [
					...allPageParams,
					alphabet[alphabet.indexOf(lastPageParam) + 1],
				]
				return alphabet[alphabet.indexOf(lastPageParam) + 1]
			}

			return undefined
		},
		getPreviousPageParam: (firstPage, allPages, firstPageParam, allPageParams) => {
			console.debug(`Albums first page: ${firstPage.title}`)
			albumPageParams.current = allPageParams
			if (firstPageParam !== alphabet[0]) {
				albumPageParams.current = allPageParams
				return alphabet[alphabet.indexOf(firstPageParam) - 1]
			}

			return undefined
		},
	})

	const playlistsInfiniteQuery = useInfiniteQuery({
		queryKey: [QueryKeys.Playlists, library?.playlistLibraryId],
		queryFn: () => fetchUserPlaylists(api, user, library),
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			return lastPage.length === QueryConfig.limits.library ? lastPageParam + 1 : undefined
		},
	})

	return {
		artistsInfiniteQuery,
		tracksInfiniteQuery,
		albumsInfiniteQuery,
		artistPageParams,
		albumPageParams,
		playlistsInfiniteQuery,
	}
}

const LibraryContext = createContext<LibraryContext>({
	artistPageParams: { current: new Set<string>() },
	albumPageParams: { current: [] },
	artistsInfiniteQuery: {
		data: undefined,
		error: null,
		isEnabled: true,
		isStale: false,
		isRefetching: false,
		isError: false,
		isLoading: true,
		isPending: true,
		isFetching: true,
		isSuccess: false,
		isFetched: false,
		hasPreviousPage: false,
		refetch: async () =>
			Promise.resolve(
				{} as InfiniteQueryObserverResult<(string | number | BaseItemDto)[], Error>,
			),
		fetchNextPage: async () =>
			Promise.resolve(
				{} as InfiniteQueryObserverResult<(string | number | BaseItemDto)[], Error>,
			),
		hasNextPage: false,
		isFetchingNextPage: false,
		isFetchPreviousPageError: false,
		isFetchNextPageError: false,
		isFetchingPreviousPage: false,
		isLoadingError: false,
		isRefetchError: false,
		isPlaceholderData: false,
		status: 'pending',
		fetchStatus: 'idle',
		dataUpdatedAt: 0,
		errorUpdatedAt: 0,
		failureCount: 0,
		failureReason: null,
		errorUpdateCount: 0,
		isFetchedAfterMount: false,
		isInitialLoading: false,
		isPaused: false,
		fetchPreviousPage: async () =>
			Promise.resolve(
				{} as InfiniteQueryObserverResult<(string | number | BaseItemDto)[], Error>,
			),
		promise: Promise.resolve([]),
	},
	albumsInfiniteQuery: {
		data: undefined,
		error: null,
		isEnabled: true,
		isStale: false,
		isRefetching: false,
		isError: false,
		isLoading: true,
		isPending: true,
		isFetching: true,
		isSuccess: false,
		isFetched: false,
		hasPreviousPage: false,
		refetch: async () =>
			Promise.resolve(
				{} as InfiniteQueryObserverResult<(string | number | BaseItemDto)[], Error>,
			),
		fetchNextPage: async () =>
			Promise.resolve(
				{} as InfiniteQueryObserverResult<(string | number | BaseItemDto)[], Error>,
			),
		hasNextPage: false,
		isFetchingNextPage: false,
		isFetchPreviousPageError: false,
		isFetchNextPageError: false,
		isFetchingPreviousPage: false,
		isLoadingError: false,
		isRefetchError: false,
		isPlaceholderData: false,
		status: 'pending',
		fetchStatus: 'idle',
		dataUpdatedAt: 0,
		errorUpdatedAt: 0,
		failureCount: 0,
		failureReason: null,
		errorUpdateCount: 0,
		isFetchedAfterMount: false,
		isInitialLoading: false,
		isPaused: false,
		fetchPreviousPage: async () =>
			Promise.resolve(
				{} as InfiniteQueryObserverResult<(string | number | BaseItemDto)[], Error>,
			),
		promise: Promise.resolve([]),
	},
	tracksInfiniteQuery: {
		data: undefined,
		error: null,
		isEnabled: true,
		isStale: false,
		isRefetching: false,
		isError: false,
		isLoading: true,
		isPending: true,
		isFetching: true,
		isSuccess: false,
		isFetched: false,
		hasPreviousPage: false,
		refetch: async () =>
			Promise.resolve(
				{} as InfiniteQueryObserverResult<(string | number | BaseItemDto)[], Error>,
			),
		fetchNextPage: async () =>
			Promise.resolve(
				{} as InfiniteQueryObserverResult<(string | number | BaseItemDto)[], Error>,
			),
		hasNextPage: false,
		isFetchingNextPage: false,
		isFetchPreviousPageError: false,
		isFetchNextPageError: false,
		isFetchingPreviousPage: false,
		isLoadingError: false,
		isRefetchError: false,
		isPlaceholderData: false,
		status: 'pending',
		fetchStatus: 'idle',
		dataUpdatedAt: 0,
		errorUpdatedAt: 0,
		failureCount: 0,
		failureReason: null,
		errorUpdateCount: 0,
		isFetchedAfterMount: false,
		isInitialLoading: false,
		isPaused: false,
		fetchPreviousPage: async () =>
			Promise.resolve(
				{} as InfiniteQueryObserverResult<(string | number | BaseItemDto)[], Error>,
			),
		promise: Promise.resolve([]),
	},
	playlistsInfiniteQuery: {
		data: undefined,
		error: null,
		isEnabled: true,
		isStale: false,
		isRefetching: false,
		isError: false,
		isLoading: true,
		isPending: true,
		isFetching: true,
		isSuccess: false,
		isFetched: false,
		hasPreviousPage: false,
		refetch: async () =>
			Promise.resolve({} as InfiniteQueryObserverResult<BaseItemDto[], Error>),
		fetchNextPage: async () =>
			Promise.resolve({} as InfiniteQueryObserverResult<BaseItemDto[], Error>),
		hasNextPage: false,
		isFetchingNextPage: false,
		isFetchPreviousPageError: false,
		isFetchNextPageError: false,
		isFetchingPreviousPage: false,
		isLoadingError: false,
		isRefetchError: false,
		isPlaceholderData: false,
		status: 'pending',
		fetchStatus: 'idle',
		dataUpdatedAt: 0,
		errorUpdatedAt: 0,
		failureCount: 0,
		failureReason: null,
		errorUpdateCount: 0,
		isFetchedAfterMount: false,
		isInitialLoading: false,
		isPaused: false,
		fetchPreviousPage: async () =>
			Promise.resolve({} as InfiniteQueryObserverResult<BaseItemDto[], Error>),
		promise: Promise.resolve([]),
	},
})

export const LibraryProvider = ({ children }: { children: React.ReactNode }) => {
	const context = LibraryContextInitializer()

	const value = useMemo(
		() => context,
		[
			context.artistsInfiniteQuery.data,
			context.artistsInfiniteQuery.isPending,
			context.tracksInfiniteQuery.data,
			context.tracksInfiniteQuery.isPending,
			context.albumsInfiniteQuery.data,
			context.albumsInfiniteQuery.isPending,
			context.playlistsInfiniteQuery.data,
			context.playlistsInfiniteQuery.isPending,
		],
	)
	return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export const useArtistPageParamsContext = () =>
	useContextSelector(LibraryContext, (context) => context.artistPageParams)
export const useArtistsInfiniteQueryContext = () =>
	useContextSelector(LibraryContext, (context) => context.artistsInfiniteQuery)
export const useTracksInfiniteQueryContext = () =>
	useContextSelector(LibraryContext, (context) => context.tracksInfiniteQuery)
export const useAlbumsInfiniteQueryContext = () =>
	useContextSelector(LibraryContext, (context) => context.albumsInfiniteQuery)
export const useAlbumPageParamsContext = () =>
	useContextSelector(LibraryContext, (context) => context.albumPageParams)
export const usePlaylistsInfiniteQueryContext = () =>
	useContextSelector(LibraryContext, (context) => context.playlistsInfiniteQuery)

export { useLibrarySortAndFilterContext }
