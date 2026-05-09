import { Api } from '@jellyfin/sdk'
import { FrequentlyPlayedTracksQueryKey } from './keys'
import { JellifyLibrary } from '@/src/types/JellifyLibrary'
import { JellifyUser } from '@/src/types/JellifyUser'
import { fetchFrequentlyPlayed } from './utils/frequents'
import { QueryKey, UseInfiniteQueryOptions } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { ApiLimits } from '../../../configs/query.config'
import { ONE_DAY } from '../../../constants/query-client'

const FREQUENTS_QUERY_CONFIG = {
	staleTime: ONE_DAY,
	refetchOnMount: false,
} as const

export const FrequentlyPlayedTracksQuery: (
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	api: Api | undefined,
) => UseInfiniteQueryOptions<BaseItemDto[], Error, BaseItemDto[], QueryKey, number> = (
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	api: Api | undefined,
) => ({
	queryKey: FrequentlyPlayedTracksQueryKey(user, library),
	queryFn: ({ pageParam }) => fetchFrequentlyPlayed(api, library, pageParam),
	select: (data) => data.pages.flatMap((page) => page),
	initialPageParam: 0,
	getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
		return lastPage.length === ApiLimits.Home ? lastPageParam + 1 : undefined
	},
	getPreviousPageParam: (firstPage, allPages, firstPageParam, allPageParams) => {
		return firstPageParam && firstPageParam > 0 ? firstPageParam - 1 : undefined
	},
	...FREQUENTS_QUERY_CONFIG,
})
