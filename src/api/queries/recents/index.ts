import { RecentlyPlayedArtistsQueryKey, RecentlyPlayedTracksQueryKey } from './keys'
import { InfiniteData, useInfiniteQuery, useQueries } from '@tanstack/react-query'
import { fetchRecentlyPlayed, fetchRecentlyPlayedArtists } from './utils'
import { ApiLimits, MaxPages } from '../../../configs/query.config'
import { isUndefined } from 'lodash'
import { useJellifyLibrary, getUser, getApi } from '../../../stores'
import { ONE_MINUTE } from '../../../constants/query-client'
import { JellifyLibrary } from '@/src/types/JellifyLibrary'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'

const RECENTS_QUERY_CONFIG = {
	maxPages: MaxPages.Home,
	staleTime: ONE_MINUTE * 5,
} as const

export const useRecentlyPlayedTracks = () => {
	const [library] = useJellifyLibrary()

	return useInfiniteQuery(PlayItAgainQuery(library))
}

export const PlayItAgainQuery = (library: JellifyLibrary | undefined) => {
	const api = getApi()

	const user = getUser()

	return {
		queryKey: RecentlyPlayedTracksQueryKey(user, library),
		queryFn: ({ pageParam }: { pageParam: number }) =>
			fetchRecentlyPlayed(api, user, library, pageParam),
		initialPageParam: 0,
		select: (data: InfiniteData<BaseItemDto[]>) => data.pages.flatMap((page) => page),
		getNextPageParam: (
			lastPage: BaseItemDto[],
			allPages: BaseItemDto[][],
			lastPageParam: number,
			allPageParams: number[],
		) => {
			return lastPage.length === ApiLimits.Home ? lastPageParam + 1 : undefined
		},
		...RECENTS_QUERY_CONFIG,
	}
}

export const useRecentArtists = () => {
	const api = getApi()
	const user = getUser()
	const [library] = useJellifyLibrary()

	const {
		data: recentlyPlayedTracks,
		isPending: recentlyPlayedTracksPending,
		isStale: recentlyPlayedTracksStale,
	} = useRecentlyPlayedTracks()

	return useInfiniteQuery({
		queryKey: RecentlyPlayedArtistsQueryKey(user, library),
		queryFn: ({ pageParam }) => fetchRecentlyPlayedArtists(api, user, library, pageParam),
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			return lastPage.length > 0 ? lastPageParam + 1 : undefined
		},
		enabled:
			!isUndefined(recentlyPlayedTracks) &&
			!recentlyPlayedTracksPending &&
			!recentlyPlayedTracksStale,
		...RECENTS_QUERY_CONFIG,
	})
}
