import { QueryKeys } from '../../enums/query-keys'
import { BaseItemDto, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client/models'
import { useJellifyContext } from '..'
import { useMemo } from 'react'
import QueryConfig from '../../api/queries/query.config'
import { fetchTracks } from '../../api/queries/tracks'
import { useLibrarySortAndFilterContext } from './sorting-filtering'
import { fetchUserPlaylists } from '../../api/queries/playlists'
import { createContext, useContextSelector } from 'use-context-selector'
import {
	InfiniteQueryObserverResult,
	useInfiniteQuery,
	UseInfiniteQueryResult,
} from '@tanstack/react-query'

export const alphabet = '#abcdefghijklmnopqrstuvwxyz'.split('')

interface LibraryContext {
	tracksInfiniteQuery: UseInfiniteQueryResult<(string | number | BaseItemDto)[], Error>
	// genres: BaseItemDto[] | undefined
	playlistsInfiniteQuery: UseInfiniteQueryResult<BaseItemDto[], Error>
}

type LibraryPage = {
	title: string
	data: BaseItemDto[]
}

const LibraryContextInitializer = () => {
	const { api, user, library } = useJellifyContext()

	const { sortDescending, isFavorites } = useLibrarySortAndFilterContext()

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
		select: (data) => data.pages.flatMap((page) => page),
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
		tracksInfiniteQuery,
		playlistsInfiniteQuery,
	}
}

const LibraryContext = createContext<LibraryContext>({
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
			context.tracksInfiniteQuery.data,
			context.tracksInfiniteQuery.isPending,
			context.playlistsInfiniteQuery.data,
			context.playlistsInfiniteQuery.isPending,
		],
	)
	return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export const useTracksInfiniteQueryContext = () =>
	useContextSelector(LibraryContext, (context) => context.tracksInfiniteQuery)
export const usePlaylistsInfiniteQueryContext = () =>
	useContextSelector(LibraryContext, (context) => context.playlistsInfiniteQuery)

export { useLibrarySortAndFilterContext }
