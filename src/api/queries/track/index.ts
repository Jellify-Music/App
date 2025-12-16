import { InfiniteData, useInfiniteQuery, UseInfiniteQueryResult } from '@tanstack/react-query'
import { TracksQueryKey } from './keys'
import fetchTracks from './utils'
import {
	BaseItemDto,
	ItemSortBy,
	SortOrder,
	UserItemDataDto,
} from '@jellyfin/sdk/lib/generated-client'
import { RefObject, useCallback, useRef } from 'react'
import flattenInfiniteQueryPages from '../../../utils/query-selectors'
import { ApiLimits } from '../../../configs/query.config'
import { useAllDownloadedTracks } from '../download'
import { queryClient } from '../../../constants/query-client'
import UserDataQueryKey from '../user-data/keys'
import { JellifyUser } from '@/src/types/JellifyUser'
import {
	useApi,
	useJellifyUser,
	useJellifyLibrary,
	useJellifyServer,
	useAdapter,
} from '../../../stores'
import useLibraryStore from '../../../stores/library'
import { unifiedTracksToBaseItems } from '../../../utils/unified-conversions'

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
	const adapter = useAdapter()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()
	const [server] = useJellifyServer()

	const isNavidrome = server?.backend === 'navidrome'
	const isJellyfin = !isNavidrome

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

	const selectTracks = useCallback(
		(data: InfiniteData<BaseItemDto[], unknown>) => {
			if (finalSortBy === ItemSortBy.SortName || finalSortBy === ItemSortBy.Name) {
				return flattenInfiniteQueryPages(data, trackPageParams)
			} else {
				return data.pages.flatMap((page) => page)
			}
		},
		[finalSortBy],
	)

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
		queryFn: async ({ pageParam }) => {
			if (isDownloaded) {
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
			}

			// For Navidrome, use the adapter
			if (isNavidrome && adapter) {
				console.debug('[useTracks] Navidrome path, artistId:', artistId)
				const unifiedTracks = await adapter.getTracks({
					artistId: artistId,
					limit: ApiLimits.Library,
					offset: pageParam * ApiLimits.Library,
				})
				console.debug('[useTracks] Got tracks:', unifiedTracks.length)

				// Convert to BaseItemDto first
				let baseItems = unifiedTracksToBaseItems(unifiedTracks)

				// Apply client-side sorting for Navidrome
				if (finalSortBy === ItemSortBy.Name || finalSortBy === ItemSortBy.SortName) {
					baseItems = baseItems.sort((a, b) => {
						const aName = (a.Name ?? '').toLowerCase()
						const bName = (b.Name ?? '').toLowerCase()
						const comparison = aName.localeCompare(bName)
						return finalSortOrder === SortOrder.Descending ? -comparison : comparison
					})
				}

				return baseItems
			}

			// For Jellyfin, use the existing fetch
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
		},
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			if (isDownloaded) return undefined
			else return lastPage.length === ApiLimits.Library ? lastPageParam + 1 : undefined
		},
		select: selectTracks,
		// Enable for both backends now
		enabled: !!adapter || isJellyfin,
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
