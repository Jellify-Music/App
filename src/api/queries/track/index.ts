import { InfiniteData, useInfiniteQuery, UseInfiniteQueryResult } from '@tanstack/react-query'
import { TracksQueryKey } from './keys'
import { useLibrarySortAndFilterContext } from '../../../providers/Library'
import { useJellifyContext } from '../../../providers'
import fetchTracks from './utils'
import { BaseItemDto, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client'
import { RefObject, useCallback, useEffect, useRef } from 'react'
import flattenInfiniteQueryPages from '../../../utils/query-selectors'
import { ApiLimits } from '../query.config'

const useTracks: () => [
	RefObject<Set<string>>,
	UseInfiniteQueryResult<(string | number | BaseItemDto)[]>,
] = () => {
	const { api, user, library } = useJellifyContext()
	const { isFavorites, sortDescending } = useLibrarySortAndFilterContext()

	const trackPageParams = useRef<Set<string>>(new Set<string>())

	const selectTracks = useCallback(
		(data: InfiniteData<BaseItemDto[], unknown>) =>
			flattenInfiniteQueryPages(data, trackPageParams),
		[],
	)

	useEffect(() => {
		console.debug(`track page pagarms: ${Array.from(trackPageParams.current).toString()}`)
	}, [trackPageParams])

	const tracksInfiniteQuery = useInfiniteQuery({
		queryKey: TracksQueryKey(isFavorites ?? false, sortDescending, library),
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
			return lastPage.length === ApiLimits.Library ? lastPageParam + 1 : undefined
		},
		select: selectTracks,
	})

	return [trackPageParams, tracksInfiniteQuery]
}

export default useTracks
