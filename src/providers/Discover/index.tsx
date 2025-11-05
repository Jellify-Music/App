import {
	InfiniteQueryObserverResult,
	useInfiniteQuery,
	UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { QueryKeys } from '../../enums/query-keys'
import { createContext, ReactNode, useContext, useState } from 'react'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { fetchPublicPlaylists } from '../../api/queries/playlist/utils'
import { fetchArtistSuggestions } from '../../api/queries/suggestions'
import { useRefetchRecentlyAdded } from '../../api/queries/album'
import { useApi, useJellifyUser, useJellifyLibrary } from '../../stores'

interface DiscoverContext {
	refreshing: boolean
	refresh: () => void
	publicPlaylists: BaseItemDto[] | undefined
	fetchNextPublicPlaylists: () => void
	hasNextPublicPlaylists: boolean
	isPendingPublicPlaylists: boolean
	isFetchingNextPublicPlaylists: boolean
	refetchPublicPlaylists: () => void
	suggestedArtistsInfiniteQuery: UseInfiniteQueryResult<BaseItemDto[], Error>
}

const DiscoverContextInitializer = () => {
	const api = useApi()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()
	const [refreshing, setRefreshing] = useState<boolean>(false)

	const refetchRecentlyAdded = useRefetchRecentlyAdded()

	const {
		data: publicPlaylists,
		refetch: refetchPublicPlaylists,
		fetchNextPage: fetchNextPublicPlaylists,
		hasNextPage: hasNextPublicPlaylists,
		isPending: isPendingPublicPlaylists,
		isFetchingNextPage: isFetchingNextPublicPlaylists,
	} = useInfiniteQuery({
		queryKey: [QueryKeys.PublicPlaylists, library?.playlistLibraryId],
		queryFn: ({ pageParam }) => fetchPublicPlaylists(api, library, pageParam),
		select: (data) => data.pages.flatMap((page) => page),
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) =>
			lastPage.length > 0 ? lastPageParam + 1 : undefined,
		initialPageParam: 0,
	})

	const suggestedArtistsInfiniteQuery = useInfiniteQuery({
		queryKey: [QueryKeys.InfiniteSuggestedArtists, user?.id, library?.musicLibraryId],
		queryFn: ({ pageParam }) =>
			fetchArtistSuggestions(api, user, library?.musicLibraryId, pageParam),
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) =>
			lastPage.length > 0 ? lastPageParam + 1 : undefined,
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		maxPages: 2,
	})

	const refresh = async () => {
		setRefreshing(true)

		await Promise.all([
			refetchRecentlyAdded(),
			refetchPublicPlaylists(),
			suggestedArtistsInfiniteQuery.refetch(),
		])
		setRefreshing(false)
	}

	return {
		refreshing,
		refresh,
		publicPlaylists,
		fetchNextPublicPlaylists,
		hasNextPublicPlaylists,
		isPendingPublicPlaylists,
		isFetchingNextPublicPlaylists,
		refetchPublicPlaylists,
		suggestedArtistsInfiniteQuery,
	}
}

const DiscoverContext = createContext<DiscoverContext>({
	refreshing: false,
	refresh: () => {},
	publicPlaylists: undefined,
	fetchNextPublicPlaylists: () => {},
	hasNextPublicPlaylists: false,
	isPendingPublicPlaylists: false,
	isFetchingNextPublicPlaylists: false,
	refetchPublicPlaylists: () => {},
	suggestedArtistsInfiniteQuery: {
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

export const DiscoverProvider: ({ children }: { children: ReactNode }) => React.JSX.Element = ({
	children,
}: {
	children: ReactNode
}) => {
	const context = DiscoverContextInitializer()

	return <DiscoverContext.Provider value={context}>{children}</DiscoverContext.Provider>
}

export const useDiscoverContext = () => useContext(DiscoverContext)
