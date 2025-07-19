import React, { createContext, ReactNode, useContext, useState } from 'react'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { InfiniteData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { QueryKeys } from '../../enums/query-keys'
import { fetchRecentlyPlayed, fetchRecentlyPlayedArtists } from '../../api/queries/recents'
import { queryClient } from '../../constants/query-client'
import QueryConfig from '../../api/queries/query.config'
import { fetchFrequentlyPlayed, fetchFrequentlyPlayedArtists } from '../../api/queries/frequents'
import { useJellifyContext } from '..'
interface HomeContext {
	refreshing: boolean
	onRefresh: () => void
	recentArtists: BaseItemDto[] | undefined
	recentTracks: InfiniteData<BaseItemDto[], unknown> | undefined

	fetchNextRecentTracks: () => void
	hasNextRecentTracks: boolean

	fetchNextRecentArtists: () => void
	hasNextRecentArtists: boolean

	fetchNextFrequentArtists: () => void
	hasNextFrequentArtists: boolean

	fetchNextFrequentlyPlayed: () => void
	hasNextFrequentlyPlayed: boolean

	frequentArtists: BaseItemDto[] | undefined
	frequentlyPlayed: InfiniteData<BaseItemDto[], unknown> | undefined

	isFetchingRecentTracks: boolean
	isFetchingRecentArtists: boolean
	isFetchingFrequentArtists: boolean
	isFetchingFrequentlyPlayed: boolean
	isFetchPreviousFrequentArtistsPageError: boolean
	isFetchPreviousRecentArtistsPageError: boolean
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
	const {
		data: recentArtists,
		isFetching: isFetchingRecentArtists,
		refetch: refetchRecentArtists,
		fetchNextPage: fetchNextRecentArtists,
		hasNextPage: hasNextRecentArtists,
		isPending: isPendingRecentArtists,
		isFetchPreviousPageError: isFetchPreviousRecentArtistsPageError,
	} = useInfiniteQuery({
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

	const {
		data: frequentArtists,
		isFetching: isFetchingFrequentArtists,
		refetch: refetchFrequentArtists,
		fetchNextPage: fetchNextFrequentArtists,
		hasNextPage: hasNextFrequentArtists,
		isPending: isPendingFrequentArtists,
		isFetchPreviousPageError: isFetchPreviousFrequentArtistsPageError,
	} = useInfiniteQuery({
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

		await Promise.all([refetchRecentArtists(), refetchFrequentArtists()])

		setRefreshing(false)
	}

	return {
		refreshing,
		onRefresh,
		recentArtists,
		recentTracks,
		frequentArtists,
		frequentlyPlayed,
		fetchNextRecentTracks,
		hasNextRecentTracks,
		fetchNextRecentArtists,
		hasNextRecentArtists,
		fetchNextFrequentArtists,
		hasNextFrequentArtists,
		fetchNextFrequentlyPlayed,
		hasNextFrequentlyPlayed,
		isFetchingRecentTracks,
		isFetchingRecentArtists,
		isFetchingFrequentArtists,
		isFetchingFrequentlyPlayed,
		isFetchPreviousFrequentArtistsPageError,
		isFetchPreviousRecentArtistsPageError,
	}
}

const HomeContext = createContext<HomeContext>({
	refreshing: false,
	onRefresh: () => {},
	recentArtists: undefined,
	recentTracks: undefined,
	frequentArtists: undefined,
	frequentlyPlayed: undefined,
	fetchNextRecentTracks: () => {},
	hasNextRecentTracks: false,
	fetchNextFrequentArtists: () => {},
	hasNextFrequentArtists: false,
	fetchNextFrequentlyPlayed: () => {},
	hasNextFrequentlyPlayed: false,
	fetchNextRecentArtists: () => {},
	hasNextRecentArtists: false,
	isFetchingRecentTracks: false,
	isFetchingRecentArtists: false,
	isFetchingFrequentArtists: false,
	isFetchingFrequentlyPlayed: false,
	isFetchPreviousFrequentArtistsPageError: false,
	isFetchPreviousRecentArtistsPageError: false,
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
