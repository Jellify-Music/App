import { InfiniteData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { fetchRecentlyAdded, fetchRecentlyPlayed } from '../../api/queries/recents'
import { QueryKeys } from '../../enums/query-keys'
import { createContext, ReactNode, useContext, useState } from 'react'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { useJellifyContext } from '..'
import { fetchPublicPlaylists } from '../../api/queries/playlists'
interface DiscoverContext {
	refreshing: boolean
	refresh: () => void
	recentlyAdded: BaseItemDto[] | undefined
	recentlyPlayed: InfiniteData<BaseItemDto[], unknown> | undefined
	publicPlaylists: BaseItemDto[] | undefined
	fetchNextRecentlyAdded: () => void
	fetchNextRecentlyPlayed: () => void
	fetchNextPublicPlaylists: () => void
	hasNextRecentlyAdded: boolean
	hasNextRecentlyPlayed: boolean
	hasNextPublicPlaylists: boolean
	isPendingRecentlyAdded: boolean
	isPendingRecentlyPlayed: boolean
	isPendingPublicPlaylists: boolean
	isFetchingNextRecentlyAdded: boolean
	isFetchingNextRecentlyPlayed: boolean
	isFetchingNextPublicPlaylists: boolean
	refetchPublicPlaylists: () => void
}

const DiscoverContextInitializer = () => {
	const { api, library, user } = useJellifyContext()
	const [refreshing, setRefreshing] = useState<boolean>(false)

	const {
		data: recentlyAdded,
		refetch: refetchRecentlyAdded,
		fetchNextPage: fetchNextRecentlyAdded,
		hasNextPage: hasNextRecentlyAdded,
		isPending: isPendingRecentlyAdded,
		isFetchingNextPage: isFetchingNextRecentlyAdded,
	} = useInfiniteQuery({
		queryKey: [QueryKeys.RecentlyAddedAlbums],
		queryFn: ({ pageParam }) => fetchRecentlyAdded(api, library, pageParam),
		select: (data) => data.pages.flatMap((page) => page),
		getNextPageParam: (lastPage, pages) => (lastPage.length > 0 ? pages.length + 1 : undefined),
		initialPageParam: 0,
	})

	const {
		data: publicPlaylists,
		refetch: refetchPublicPlaylists,
		fetchNextPage: fetchNextPublicPlaylists,
		hasNextPage: hasNextPublicPlaylists,
		isPending: isPendingPublicPlaylists,
		isFetchingNextPage: isFetchingNextPublicPlaylists,
	} = useInfiniteQuery({
		queryKey: [QueryKeys.PublicPlaylists],
		queryFn: ({ pageParam }) => fetchPublicPlaylists(api, library, pageParam),
		select: (data) => data.pages.flatMap((page) => page),
		getNextPageParam: (lastPage, pages) => (lastPage.length > 0 ? pages.length + 1 : undefined),
		initialPageParam: 0,
	})

	const {
		data: recentlyPlayed,
		refetch: refetchRecentlyPlayed,
		fetchNextPage: fetchNextRecentlyPlayed,
		hasNextPage: hasNextRecentlyPlayed,
		isPending: isPendingRecentlyPlayed,
		isFetchingNextPage: isFetchingNextRecentlyPlayed,
	} = useInfiniteQuery({
		queryKey: [QueryKeys.RecentlyPlayed],
		queryFn: ({ pageParam }) => fetchRecentlyPlayed(api, user, library, pageParam),
		getNextPageParam: (lastPage, pages) => (lastPage.length > 0 ? pages.length + 1 : undefined),
		initialPageParam: 0,
	})

	const refresh = async () => {
		setRefreshing(true)

		await Promise.all([
			refetchRecentlyAdded(),
			refetchRecentlyPlayed(),
			refetchPublicPlaylists(),
		])
		setRefreshing(false)
	}

	return {
		refreshing,
		refresh,
		recentlyAdded,
		recentlyPlayed,
		publicPlaylists,
		fetchNextRecentlyAdded,
		fetchNextRecentlyPlayed,
		fetchNextPublicPlaylists,
		hasNextRecentlyAdded,
		hasNextRecentlyPlayed,
		hasNextPublicPlaylists,
		isPendingRecentlyAdded,
		isPendingRecentlyPlayed,
		isPendingPublicPlaylists,
		isFetchingNextRecentlyAdded,
		isFetchingNextRecentlyPlayed,
		isFetchingNextPublicPlaylists,
		refetchPublicPlaylists,
	}
}

const DiscoverContext = createContext<DiscoverContext>({
	refreshing: false,
	refresh: () => {},
	recentlyAdded: undefined,
	recentlyPlayed: undefined,
	publicPlaylists: undefined,
	fetchNextRecentlyAdded: () => {},
	fetchNextRecentlyPlayed: () => {},
	fetchNextPublicPlaylists: () => {},
	hasNextRecentlyAdded: false,
	hasNextRecentlyPlayed: false,
	hasNextPublicPlaylists: false,
	isPendingRecentlyAdded: false,
	isPendingRecentlyPlayed: false,
	isPendingPublicPlaylists: false,
	isFetchingNextRecentlyAdded: false,
	isFetchingNextRecentlyPlayed: false,
	isFetchingNextPublicPlaylists: false,
	refetchPublicPlaylists: () => {},
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
