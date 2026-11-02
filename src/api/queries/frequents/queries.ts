import { Api } from '@jellyfin/sdk'
import { FrequentlyPlayedTracksQueryKey } from './keys'
import { JellifyLibrary } from '@/src/types/JellifyLibrary'
import { JellifyUser } from '@/src/types/JellifyUser'
import { fetchFrequentlyPlayed } from './utils/frequents'
import { ApiLimits } from '../../../configs/querying/index.config'
import { QueryAges } from '../../../constants/durations'
import { BaseItemDtoInfiniteQueryOptions } from '../../types/infinite-query'

const FREQUENTS_QUERY_CONFIG: Pick<
	BaseItemDtoInfiniteQueryOptions,
	'staleTime' | 'refetchOnMount'
> = {
	staleTime: QueryAges.OneDay,
	refetchOnMount: false,
} as const

export const FrequentlyPlayedTracksQuery: (
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	api: Api | undefined,
) => BaseItemDtoInfiniteQueryOptions = (
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	api: Api | undefined,
) => ({
	queryKey: FrequentlyPlayedTracksQueryKey(user, library),
	queryFn: ({ pageParam, signal }) => fetchFrequentlyPlayed(api, library, pageParam, signal),
	select: (data) => data.pages.flatMap((page) => page),
	initialPageParam: 0,
	getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
		return lastPage.length === ApiLimits.Frequents ? lastPageParam + 1 : undefined
	},
	getPreviousPageParam: (firstPage, allPages, firstPageParam, allPageParams) => {
		return firstPageParam && firstPageParam > 0 ? firstPageParam - 1 : undefined
	},
	...FREQUENTS_QUERY_CONFIG,
})
