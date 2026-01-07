import { InfiniteData, useInfiniteQuery, UseInfiniteQueryResult } from '@tanstack/react-query'
import { TracksQueryKey } from './keys'
import fetchTracks from './utils'
import {
	BaseItemDto,
	ItemSortBy,
	SortOrder,
	UserItemDataDto,
} from '@jellyfin/sdk/lib/generated-client'
import { RefObject, useRef } from 'react'
import flattenInfiniteQueryPages from '../../../utils/query-selectors'
import { ApiLimits } from '../../../configs/query.config'
import { useAllDownloadedTracks } from '../download'
import { queryClient } from '../../../constants/query-client'
import UserDataQueryKey from '../user-data/keys'
import { JellifyUser } from '@/src/types/JellifyUser'
import { useApi, useJellifyUser, useJellifyLibrary } from '../../../stores'
import useLibraryStore from '../../../stores/library'

const useTracks: (
	artistId?: string,
	sortBy?: ItemSortBy,
	sortOrder?: SortOrder,
	isFavorites?: boolean,
) => [RefObject<Set<string>>, UseInfiniteQueryResult<(string | number | BaseItemDto)[]>] = (
	artistId,
	sortBy,
	sortOrder,
	isFavoritesParam,
) => {
	const api = useApi()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()
	const {
		isFavorites: isLibraryFavorites,
		sortDescending: isLibrarySortDescending,
		isDownloaded,
	} = useLibraryStore()

	// Use provided values or fallback to library context
	// If artistId is present, we use isFavoritesParam if provided, otherwise false (default to showing all artist tracks)
	// If artistId is NOT present, we use isFavoritesParam if provided, otherwise fallback to library context
	const isFavorites =
		isFavoritesParam !== undefined
			? isFavoritesParam
			: artistId
				? undefined
				: isLibraryFavorites
	const finalSortBy = sortBy ?? ItemSortBy.Name
	const finalSortOrder =
		sortOrder ?? (isLibrarySortDescending ? SortOrder.Descending : SortOrder.Ascending)

	const { data: downloadedTracks } = useAllDownloadedTracks()

	const trackPageParams = useRef<Set<string>>(new Set<string>())

	const selectTracks = (data: InfiniteData<BaseItemDto[], unknown>) => {
		if (finalSortBy === ItemSortBy.SortName || finalSortBy === ItemSortBy.Name) {
			return flattenInfiniteQueryPages(data, trackPageParams)
		} else {
			return data.pages.flatMap((page) => page)
		}
	}

	const tracksInfiniteQuery = useInfiniteQuery({
		queryKey: TracksQueryKey(
			isFavorites ?? false,
			isDownloaded,
			finalSortOrder === SortOrder.Descending,
			library,
			downloadedTracks?.length,
			artistId,
			finalSortBy,
			finalSortOrder,
		),
		queryFn: ({ pageParam }) => {
			if (!isDownloaded)
				return fetchTracks(
					api,
					user,
					library,
					pageParam,
					isFavorites,
					finalSortBy,
					finalSortOrder,
					artistId,
				)
			else
				return (downloadedTracks ?? [])
					.map(({ item }) => item)
					.sort((a, b) => {
						const aName = a.Name ?? ''
						const bName = b.Name ?? ''
						if (aName < bName) return -1
						else if (aName === bName) return 0
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
