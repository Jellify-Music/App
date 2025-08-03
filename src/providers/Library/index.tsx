import { QueryKeys } from '../../enums/query-keys'
import { BaseItemDto, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client/models'
import {
	FetchNextPageOptions,
	InfiniteData,
	InfiniteQueryObserverResult,
	useInfiniteQuery,
	UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { useJellifyContext } from '..'
import { fetchArtists } from '../../api/queries/artist'
import { createContext, RefObject, useContext, useMemo, useRef } from 'react'
import QueryConfig from '../../api/queries/query.config'
import { fetchTracks } from '../../api/queries/tracks'
import { fetchAlbums } from '../../api/queries/album'
import { useLibrarySortAndFilterContext } from './sorting-filtering'
import { fetchUserPlaylists } from '../../api/queries/playlists'
import Artists from '../../components/Artists/component'
import { isString, isUndefined } from 'lodash'

export const alphabet = '#abcdefghijklmnopqrstuvwxyz'.split('')

interface LibraryContext {
	artistsInfiniteQuery: UseInfiniteQueryResult<(string | number | BaseItemDto)[], Error>
	albums: (string | number | BaseItemDto)[] | undefined
	tracks: InfiniteData<BaseItemDto[], unknown> | undefined
	// genres: BaseItemDto[] | undefined
	playlists: BaseItemDto[] | undefined

	refetchAlbums: () => void
	refetchTracks: () => void
	// refetchGenres: () => void
	refetchPlaylists: () => void

	fetchNextTracksPage: (options?: FetchNextPageOptions | undefined) => void
	hasNextTracksPage: boolean

	fetchNextAlbumsPage: (
		options?: FetchNextPageOptions | undefined,
	) => Promise<InfiniteQueryObserverResult<(string | number | BaseItemDto)[], Error>>
	hasNextAlbumsPage: boolean

	fetchNextPlaylistsPage: (
		options?: FetchNextPageOptions | undefined,
	) => Promise<InfiniteQueryObserverResult<BaseItemDto[], Error>>
	hasNextPlaylistsPage: boolean

	isPendingTracks: boolean
	isPendingAlbums: boolean
	isPendingPlaylists: boolean

	artistPageParams: RefObject<Set<string>>
	albumPageParams: RefObject<string[]>

	isFetchingNextTracksPage: boolean
	isFetchingNextAlbumsPage: boolean
	isFetchingNextPlaylistsPage: boolean

	isFetchPreviousPlaylistsPageError: boolean
}

const LibraryContextInitializer = () => {
	const { api, user, library } = useJellifyContext()

	const { sortDescending, isFavorites } = useLibrarySortAndFilterContext()

	const artistPageParams = useRef<Set<string>>(new Set<string>())

	const albumPageParams = useRef<string[]>([])

	const artistsInfiniteQuery = useInfiniteQuery({
		queryKey: [QueryKeys.InfiniteArtists, isFavorites, sortDescending, library?.musicLibraryId],
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
		select: (data) => {
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
		},
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			return lastPage.length === QueryConfig.limits.library ? lastPageParam + 1 : undefined
		},
		getPreviousPageParam: (firstPage, allPages, firstPageParam, allPageParams) => {
			return firstPageParam === 0 ? null : firstPageParam - 1
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
	})

	const {
		data: albums,
		isPending: isPendingAlbums,
		refetch: refetchAlbums,
		fetchNextPage: fetchNextAlbumsPage,
		isFetchingNextPage: isFetchingNextAlbumsPage,
		hasNextPage: hasNextAlbumsPage,
	} = useInfiniteQuery({
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

	const {
		data: playlists,
		isPending: isPendingPlaylists,
		refetch: refetchPlaylists,
		fetchNextPage: fetchNextPlaylistsPage,
		isFetchingNextPage: isFetchingNextPlaylistsPage,
		hasNextPage: hasNextPlaylistsPage,
		isFetchPreviousPageError: isFetchPreviousPlaylistsPageError,
	} = useInfiniteQuery({
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
		tracks,
		refetchTracks,
		fetchNextTracksPage,
		hasNextTracksPage,
		albums,
		refetchAlbums,
		fetchNextAlbumsPage,
		hasNextAlbumsPage,
		isPendingTracks,
		isPendingAlbums,
		artistPageParams,
		albumPageParams,
		playlists,
		refetchPlaylists,
		fetchNextPlaylistsPage,
		hasNextPlaylistsPage,
		isPendingPlaylists,
		isFetchingNextPlaylistsPage,
		isFetchingNextTracksPage,
		isFetchingNextAlbumsPage,
		isFetchPreviousPlaylistsPageError,
	}
}

const LibraryContext = createContext<LibraryContext>({
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
	playlists: undefined,
	refetchPlaylists: () => {},
	hasNextPlaylistsPage: false,
	isPendingPlaylists: false,
	fetchNextPlaylistsPage: async () => {
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
	isFetchingNextPlaylistsPage: false,
	isFetchPreviousPlaylistsPageError: false,
	hasNextAlbumsPage: false,
	isPendingTracks: false,
	isPendingAlbums: false,
	artistPageParams: { current: new Set<string>() },
	albumPageParams: { current: [] },
	isFetchingNextTracksPage: false,
	isFetchingNextAlbumsPage: false,
})

export const LibraryProvider = ({ children }: { children: React.ReactNode }) => {
	const context = LibraryContextInitializer()

	const value = useMemo(
		() => context,
		[
			context.artistsInfiniteQuery.data,
			context.artistsInfiniteQuery.isFetching,
			context.tracks,
			context.albums,
			context.playlists,
		],
	)
	return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export const useLibraryContext = () => useContext(LibraryContext)
export { useLibrarySortAndFilterContext }
