import { InfiniteData, useInfiniteQuery, UseInfiniteQueryResult } from '@tanstack/react-query'
import { TracksQueryKey } from './keys'
import { useLibrarySortAndFilterContext } from '../../../providers/Library'
import fetchTracks from './utils'
import {
	BaseItemDto,
	ItemSortBy,
	SortOrder,
	UserItemDataDto,
} from '@jellyfin/sdk/lib/generated-client'
import { RefObject, useCallback, useRef } from 'react'
import flattenInfiniteQueryPages from '../../../utils/query-selectors'
import { ApiLimits } from '../query.config'
import { useAllDownloadedTracks } from '../download'
import { queryClient } from '../../../constants/query-client'
import UserDataQueryKey from '../user-data/keys'
import { JellifyUser } from '@/src/types/JellifyUser'
import { useApi, useJellifyUser, useJellifyLibrary } from '../../../stores'

const useTracks: () => [
	RefObject<Set<string>>,
	UseInfiniteQueryResult<(string | number | BaseItemDto)[]>,
] = () => {
	const api = useApi()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()
	const { isFavorites, sortDescending, isDownloaded } = useLibrarySortAndFilterContext()

	const { data: downloadedTracks } = useAllDownloadedTracks()

	const trackPageParams = useRef<Set<string>>(new Set<string>())

	const selectTracks = useCallback(
		(data: InfiniteData<BaseItemDto[], unknown>) =>
			flattenInfiniteQueryPages(data, trackPageParams),
		[],
	)

	const tracksInfiniteQuery = useInfiniteQuery({
		queryKey: TracksQueryKey(
			isFavorites ?? false,
			isDownloaded,
			sortDescending,
			library,
			downloadedTracks?.length,
		),
		queryFn: ({ pageParam }) => {
			if (!isDownloaded)
				return fetchTracks(
					api,
					user,
					library,
					pageParam,
					isFavorites,
					ItemSortBy.Name,
					sortDescending ? SortOrder.Descending : SortOrder.Ascending,
				)
			else
				return (downloadedTracks ?? [])
					.map(({ item }) => item)
					.sort((a, b) => {
						if ((a.Name ?? '') < (b.Name ?? '')) return -1
						else if ((a.Name ?? '') === (b.Name ?? '')) return 0
						else return 1
					})
					.filter((track) => {
						if (!isFavorites) return true
						else return isDownloadedTrackAlsoFavorite(user, track)
					})
		},
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			if (isDownloaded) return undefined
			else return lastPage.length === ApiLimits.Library ? lastPageParam + 1 : undefined
		},
		select: selectTracks,
	})

	return [trackPageParams, tracksInfiniteQuery]
}

export default useTracks

function isDownloadedTrackAlsoFavorite(user: JellifyUser | undefined, track: BaseItemDto): boolean {
	if (!user) return false

	const userData = queryClient.getQueryData(UserDataQueryKey(user!, track)) as
		| UserItemDataDto
		| undefined

	return userData?.IsFavorite ?? false
}
