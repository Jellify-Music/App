import React, { createContext, ReactNode, useContext, useState } from 'react'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import {
	InfiniteData,
	InfiniteQueryObserverResult,
	useInfiniteQuery,
	UseInfiniteQueryResult,
	useQuery,
} from '@tanstack/react-query'
import { QueryKeys } from '../../enums/query-keys'
import { fetchRecentlyPlayed, fetchRecentlyPlayedArtists } from '../../api/queries/recents'
import { queryClient } from '../../constants/query-client'
import QueryConfig from '../../api/queries/query.config'
import { fetchFrequentlyPlayed, fetchFrequentlyPlayedArtists } from '../../api/queries/frequents'
import { useJellifyContext } from '..'
interface HomeContext {
	refreshing: boolean
	onRefresh: () => void
	recentTracks: InfiniteData<BaseItemDto[], unknown> | undefined

	fetchNextRecentTracks: () => void
	hasNextRecentTracks: boolean

	fetchNextFrequentlyPlayed: () => void
	hasNextFrequentlyPlayed: boolean

	frequentlyPlayed: InfiniteData<BaseItemDto[], unknown> | undefined

	isFetchingRecentTracks: boolean
	isFetchingFrequentlyPlayed: boolean

	recentArtistsInfiniteQuery: UseInfiniteQueryResult<BaseItemDto[], Error>
	frequentArtistsInfiniteQuery: UseInfiniteQueryResult<BaseItemDto[], Error>
}

const HomeContextInitializer = () => {
	const { api, library, user } = useJellifyContext()
	const [refreshing, setRefreshing] = useState<boolean>(false)

	const {
		data: recentTracks,
		isFetching: isFetchingRecentTracks,
		refetch: refetchRecentTracks,
		isError: isErrorRecentTracks,
		fetchNextPage: fetchNextRecentTracks,
		hasNextPage: hasNextRecentTracks,
		isPending: isPendingRecentTracks,
	} = useInfiniteQuery({
		queryKey: [QueryKeys.RecentlyPlayed],
		queryFn: ({ pageParam }) => fetchRecentlyPlayed(api, user, library, pageParam),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			console.debug('Getting next page for recent tracks')
			return lastPage.length === QueryConfig.limits.recents ? lastPageParam + 1 : undefined
		},
	})
	const recentArtistsInfiniteQuery = useInfiniteQuery({
		queryKey: [QueryKeys.RecentlyPlayedArtists],
		queryFn: ({ pageParam }) => fetchRecentlyPlayedArtists(pageParam),
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			console.debug('Getting next page for recent artists')
			return lastPage.length > 0 ? lastPageParam + 1 : undefined
		},
		enabled: !!recentTracks && recentTracks.pages.length > 0,
	})

	const {
		data: frequentlyPlayed,
		isFetching: isFetchingFrequentlyPlayed,
		refetch: refetchFrequentlyPlayed,
		fetchNextPage: fetchNextFrequentlyPlayed,
		hasNextPage: hasNextFrequentlyPlayed,
		isPending: isPendingFrequentlyPlayed,
	} = useInfiniteQuery({
		queryKey: [QueryKeys.FrequentlyPlayed],
		queryFn: ({ pageParam }) => fetchFrequentlyPlayed(api, library, pageParam),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			console.debug('Getting next page for frequently played')
			return lastPage.length === QueryConfig.limits.recents ? lastPageParam + 1 : undefined
		},
	})

	const frequentArtistsInfiniteQuery = useInfiniteQuery({
		queryKey: [QueryKeys.FrequentArtists],
		queryFn: ({ pageParam }) => fetchFrequentlyPlayedArtists(api, library, pageParam),
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			console.debug('Getting next page for frequent artists')
			return lastPage.length === 100 ? lastPageParam + 1 : undefined
		},
	})

	const onRefresh = async () => {
		setRefreshing(true)

		queryClient.invalidateQueries({
			queryKey: [
				QueryKeys.RecentlyPlayedArtists,
				QueryConfig.limits.recents * 4,
				QueryConfig.limits.recents,
			],
		})

		queryClient.invalidateQueries({
			queryKey: [
				QueryKeys.RecentlyPlayed,
				QueryConfig.limits.recents * 4,
				QueryConfig.limits.recents,
			],
		})

		await Promise.all([refetchRecentTracks(), refetchFrequentlyPlayed()])

		await Promise.all([
			recentArtistsInfiniteQuery.refetch(),
			frequentArtistsInfiniteQuery.refetch(),
		])

		setRefreshing(false)
	}

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
