import React, {
	createContext,
	ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import {
	InfiniteData,
	InfiniteQueryObserverResult,
	useInfiniteQuery,
	UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { QueryKeys } from '../../enums/query-keys'
import { fetchRecentlyPlayed, fetchRecentlyPlayedArtists } from '../../api/queries/recents'
import { queryClient } from '../../constants/query-client'
import QueryConfig from '../../api/queries/query.config'
import { fetchFrequentlyPlayed, fetchFrequentlyPlayedArtists } from '../../api/queries/frequents'
import { useJellifyContext } from '..'
import { useIsFocused } from '@react-navigation/native'
interface HomeContext {
	refreshing: boolean
	onRefresh: () => void
	recentTracks: BaseItemDto[] | undefined

	fetchNextRecentTracks: () => void
	hasNextRecentTracks: boolean

	fetchNextFrequentlyPlayed: () => void
	hasNextFrequentlyPlayed: boolean

	frequentlyPlayed: BaseItemDto[] | undefined

	isFetchingRecentTracks: boolean
	isFetchingFrequentlyPlayed: boolean

	recentArtistsInfiniteQuery: UseInfiniteQueryResult<BaseItemDto[], Error>
	frequentArtistsInfiniteQuery: UseInfiniteQueryResult<BaseItemDto[], Error>
}

const HomeContextInitializer = () => {
	const { api, library, user } = useJellifyContext()
	const [refreshing, setRefreshing] = useState<boolean>(false)

	const isFocused = useIsFocused()

	useEffect(() => {
		console.debug(`Home focused: ${isFocused}`)
	}, [isFocused])

	const {
		data: recentTracks,
		isFetching: isFetchingRecentTracks,
		refetch: refetchRecentTracks,
		isError: isErrorRecentTracks,
		fetchNextPage: fetchNextRecentTracks,
		hasNextPage: hasNextRecentTracks,
		isPending: isPendingRecentTracks,
		isStale: isStaleRecentTracks,
	} = useInfiniteQuery({
		queryKey: [QueryKeys.RecentlyPlayed, library?.musicLibraryId],
		queryFn: ({ pageParam }) => fetchRecentlyPlayed(api, user, library, pageParam),
		initialPageParam: 0,
		select: (data) => data.pages.flatMap((page) => page),
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			console.debug('Getting next page for recent tracks')
			return lastPage.length === QueryConfig.limits.recents ? lastPageParam + 1 : undefined
		},
	})
	const recentArtistsInfiniteQuery = useInfiniteQuery({
		queryKey: [QueryKeys.RecentlyPlayedArtists, library?.musicLibraryId],
		queryFn: ({ pageParam }) => fetchRecentlyPlayedArtists(api, user, library, pageParam),
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			console.debug('Getting next page for recent artists')
			return lastPage.length > 0 ? lastPageParam + 1 : undefined
		},
		enabled: !!recentTracks && recentTracks.length > 0 && !isPendingRecentTracks,
	})

	const {
		data: frequentlyPlayed,
		isFetching: isFetchingFrequentlyPlayed,
		refetch: refetchFrequentlyPlayed,
		fetchNextPage: fetchNextFrequentlyPlayed,
		hasNextPage: hasNextFrequentlyPlayed,
		isPending: isPendingFrequentlyPlayed,
		isStale: isStaleFrequentlyPlayed,
	} = useInfiniteQuery({
		queryKey: [QueryKeys.FrequentlyPlayed, library?.musicLibraryId],
		queryFn: ({ pageParam }) => fetchFrequentlyPlayed(api, library, pageParam),
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			console.debug('Getting next page for frequently played')
			return lastPage.length === QueryConfig.limits.recents ? lastPageParam + 1 : undefined
		},
	})

	const frequentArtistsInfiniteQuery = useInfiniteQuery({
		queryKey: [QueryKeys.FrequentArtists, library?.musicLibraryId],
		queryFn: ({ pageParam }) => fetchFrequentlyPlayedArtists(api, library, pageParam),
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			console.debug('Getting next page for frequent artists')
			return lastPage.length === 100 ? lastPageParam + 1 : undefined
		},
		enabled: !!frequentlyPlayed && frequentlyPlayed.length > 0 && !isStaleFrequentlyPlayed,
	})

	const onRefresh = useCallback(async () => {
		setRefreshing(true)

		queryClient.invalidateQueries({ queryKey: [QueryKeys.RecentlyPlayedArtists] })
		queryClient.invalidateQueries({ queryKey: [QueryKeys.RecentlyPlayed] })
		queryClient.invalidateQueries({ queryKey: [QueryKeys.FrequentlyPlayed] })
		queryClient.invalidateQueries({ queryKey: [QueryKeys.FrequentArtists] })

		await Promise.all([refetchRecentTracks(), refetchFrequentlyPlayed()])

		await Promise.all([
			recentArtistsInfiniteQuery.refetch(),
			frequentArtistsInfiniteQuery.refetch(),
		])

		setRefreshing(false)
	}, [
		refetchRecentTracks,
		refetchFrequentlyPlayed,
		recentArtistsInfiniteQuery.refetch,
		frequentArtistsInfiniteQuery.refetch,
	])

	return {
		refreshing,
		onRefresh,
		recentTracks,
		recentArtistsInfiniteQuery,
		frequentArtistsInfiniteQuery,
		isFetchingRecentTracks,
		isFetchingFrequentlyPlayed,
		fetchNextRecentTracks,
		hasNextRecentTracks,
		fetchNextFrequentlyPlayed,
		hasNextFrequentlyPlayed,
		frequentlyPlayed,
	}
}

const HomeContext = createContext<HomeContext>({
	refreshing: false,
	onRefresh: () => {},
	recentTracks: undefined,
	frequentlyPlayed: undefined,
	isFetchingRecentTracks: false,
	isFetchingFrequentlyPlayed: false,
	recentArtistsInfiniteQuery: {
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
		isFetchingPreviousPage: false,
		isFetchPreviousPageError: false,
		isFetchNextPageError: false,
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
	frequentArtistsInfiniteQuery: {
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
		isFetchingPreviousPage: false,
		isFetchPreviousPageError: false,
		isFetchNextPageError: false,
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
	fetchNextRecentTracks: () => {},
	hasNextRecentTracks: false,
	fetchNextFrequentlyPlayed: () => {},
	hasNextFrequentlyPlayed: false,
})

export const HomeProvider: ({ children }: { children: ReactNode }) => React.JSX.Element = ({
	children,
}: {
	children: ReactNode
}) => {
	const context = HomeContextInitializer()

	return <HomeContext.Provider value={context}>{children}</HomeContext.Provider>
}

export const useHomeContext = () => useContext(HomeContext)
