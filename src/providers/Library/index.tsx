import { QueryKeys } from '../../enums/query-keys'
import { BaseItemDto, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client/models'
import {
	FetchNextPageOptions,
	FetchPreviousPageOptions,
	InfiniteData,
	InfiniteQueryObserverResult,
	QueryObserverResult,
	useInfiniteQuery,
} from '@tanstack/react-query'
import { useJellifyContext } from '..'
import { fetchArtists } from '../../api/queries/artist'
import { createContext, RefObject, useContext, useRef, useState } from 'react'
import { useDisplayContext } from '../Display/display-provider'
import QueryConfig from '../../api/queries/query.config'
import { fetchTracks } from '../../api/queries/tracks'
import { fetchAlbums } from '../../api/queries/album'
import { useLibrarySortAndFilterContext } from './sorting-filtering'

export const alphabet = '#abcdefghijklmnopqrstuvwxyz'.split('')

interface LibraryContext {
	artists: (string | number | BaseItemDto)[] | undefined
	albums: (string | number | BaseItemDto)[] | undefined
	tracks: InfiniteData<BaseItemDto[], unknown> | undefined
	// genres: BaseItemDto[] | undefined
	// playlists: BaseItemDto[] | undefined

	refetchArtists: () => void
	refetchAlbums: () => void
	refetchTracks: () => void
	// refetchGenres: () => void
	// refetchPlaylists: () => void

	fetchNextArtistsPage: (
		options?: FetchNextPageOptions,
	) => Promise<InfiniteQueryObserverResult<(string | number | BaseItemDto)[], Error>>
	hasNextArtistsPage: boolean

	fetchNextTracksPage: (options?: FetchNextPageOptions | undefined) => void
	hasNextTracksPage: boolean

	fetchNextAlbumsPage: (
		options?: FetchNextPageOptions | undefined,
	) => Promise<InfiniteQueryObserverResult<(string | number | BaseItemDto)[], Error>>
	hasNextAlbumsPage: boolean

	isPendingArtists: boolean
	isPendingTracks: boolean
	isPendingAlbums: boolean

	artistPageParams: RefObject<string[]>
	albumPageParams: RefObject<string[]>
	isFetchingNextArtistsPage: boolean
	isFetchingNextTracksPage: boolean
	isFetchingNextAlbumsPage: boolean
}

const LibraryContextInitializer = () => {
	const { api, user, library } = useJellifyContext()

	const { numberOfColumns } = useDisplayContext()

	const { sortDescending, isFavorites } = useLibrarySortAndFilterContext()

	const artistPageParams = useRef<string[]>([])

	const albumPageParams = useRef<string[]>([])

	const {
		data: artists,
		isPending: isPendingArtists,
		refetch: refetchArtists,
		fetchNextPage: fetchNextArtistsPage,
		hasNextPage: hasNextArtistsPage,
		isFetchingNextPage: isFetchingNextArtistsPage,
	} = useInfiniteQuery({
		queryKey: [QueryKeys.AllArtistsAlphabetical, isFavorites, sortDescending],
		queryFn: ({ pageParam }) =>
			fetchArtists(
				api,
				user,
				library,
				pageParam,
				isFavorites,
				[ItemSortBy.SortName],
				[sortDescending ? SortOrder.Descending : SortOrder.Ascending],
			),
		select: (data) => data.pages.flatMap((page) => [page.title, ...page.data]),
		initialPageParam: alphabet[0],
		maxPages: alphabet.length,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			console.debug(`Fetching next Artists page, last page: ${lastPage.title}`)
			console.debug(`fetching artist params: ${allPageParams.join(', ')}`)
			if (lastPageParam !== alphabet[alphabet.length - 1]) {
				artistPageParams.current = [
					...allPageParams,
					alphabet[alphabet.indexOf(lastPageParam) + 1],
				]
				return alphabet[alphabet.indexOf(lastPageParam) + 1]
			}

			return undefined
		},
		getPreviousPageParam: (firstPage, allPages, firstPageParam, allPageParams) => {
			console.debug(`Artists first page: ${firstPage.title}`)
			artistPageParams.current = allPageParams
			if (firstPageParam !== alphabet[0]) {
				artistPageParams.current = allPageParams
				return alphabet[alphabet.indexOf(firstPageParam) - 1]
			}

			return undefined
		},
	})

	const {
		data: tracks,
		isPending: isPendingTracks,
		refetch: refetchTracks,
		fetchNextPage: fetchNextTracksPage,
		isFetchingNextPage: isFetchingNextTracksPage,
		isError: isFetchingTracksError,
		hasNextPage: hasNextTracksPage,
	} = useInfiniteQuery({
		queryKey: [QueryKeys.AllTracks, isFavorites, sortDescending],
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
	})

	const {
		data: albums,
		isPending: isPendingAlbums,
		refetch: refetchAlbums,
		fetchNextPage: fetchNextAlbumsPage,
		isFetchingNextPage: isFetchingNextAlbumsPage,
		hasNextPage: hasNextAlbumsPage,
	} = useInfiniteQuery({
		queryKey: [QueryKeys.AllAlbumsAlphabetical, isFavorites],
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

	return {
		artists,
		refetchArtists,
		fetchNextArtistsPage,
		hasNextArtistsPage,
		tracks,
		refetchTracks,
		fetchNextTracksPage,
		hasNextTracksPage,
		albums,
		refetchAlbums,
		fetchNextAlbumsPage,
		hasNextAlbumsPage,
		isPendingArtists,
		isPendingTracks,
		isPendingAlbums,
		artistPageParams,
		albumPageParams,
		isFetchingNextArtistsPage,
		isFetchingNextTracksPage,
		isFetchingNextAlbumsPage,
	}
}

const LibraryContext = createContext<LibraryContext>({
	artists: undefined,
	refetchArtists: () => {},
	fetchNextArtistsPage: async () => {
		return {
			data: [],
			status: 'success',
			fetchStatus: 'idle',
			isFetching: false,
			isEnabled: true,
			isLoading: false,
			isSuccess: true,
			isError: false,
			isStale: false,
			error: null,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			refetch: async () => Promise.resolve({} as any),
			remove: () => {},
			dataUpdatedAt: 0,
			errorUpdatedAt: 0,
			failureCount: 0,
			isFetched: true,
			isFetchingNextPage: false,
			isFetchingPreviousPage: false,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			fetchNextPage: async () => Promise.resolve({} as any),
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			fetchPreviousPage: async () => Promise.resolve({} as any),
			hasNextPage: false,
			hasPreviousPage: false,
			isPending: false,
			isLoadingError: false,
			isRefetchError: false,
			isPlaceholderData: false,
			isFetchNextPageError: false,
			isFetchPreviousPageError: false,
			failureReason: null,
			errorUpdateCount: 0,
			isFetchedAfterMount: true,
			isInitialLoading: false,
			isPaused: false,
			isRefetching: false,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			promise: Promise.resolve({} as any),
		}
	},
	hasNextArtistsPage: false,
	tracks: undefined,
	refetchTracks: () => {},
	fetchNextTracksPage: () => {},
	hasNextTracksPage: false,
	albums: undefined,
	refetchAlbums: () => {},
	fetchNextAlbumsPage: async () => {
		return {
			data: [],
			status: 'success',
			fetchStatus: 'idle',
			isFetching: false,
			isEnabled: true,
			isLoading: false,
			isSuccess: true,
			isError: false,
			isStale: false,
			error: null,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			refetch: async () => Promise.resolve({} as any),
			remove: () => {},
			dataUpdatedAt: 0,
			errorUpdatedAt: 0,
			failureCount: 0,
			isFetched: true,
			isFetchingNextPage: false,
			isFetchingPreviousPage: false,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			fetchNextPage: async () => Promise.resolve({} as any),
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			fetchPreviousPage: async () => Promise.resolve({} as any),
			hasNextPage: false,
			hasPreviousPage: false,
			isPending: false,
			isLoadingError: false,
			isRefetchError: false,
			isPlaceholderData: false,
			isFetchNextPageError: false,
			isFetchPreviousPageError: false,
			failureReason: null,
			errorUpdateCount: 0,
			isFetchedAfterMount: true,
			isInitialLoading: false,
			isPaused: false,
			isRefetching: false,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			promise: Promise.resolve({} as any),
		}
	},
	hasNextAlbumsPage: false,
	isPendingArtists: false,
	isPendingTracks: false,
	isPendingAlbums: false,
	artistPageParams: { current: [] },
	albumPageParams: { current: [] },
	isFetchingNextArtistsPage: false,
	isFetchingNextTracksPage: false,
	isFetchingNextAlbumsPage: false,
})

export const LibraryProvider = ({ children }: { children: React.ReactNode }) => {
	const context = LibraryContextInitializer()

	return <LibraryContext.Provider value={context}>{children}</LibraryContext.Provider>
}

export const useLibraryContext = () => useContext(LibraryContext)
export { useLibrarySortAndFilterContext }
