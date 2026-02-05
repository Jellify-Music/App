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
import { useJellifyLibrary, getApi, getUser } from '../../../stores'
import useLibraryStore from '../../../stores/library'

const useTracks: (
	artistId?: string,
	sortBy?: ItemSortBy,
	sortOrder?: SortOrder,
	isFavorites?: boolean,
	isUnplayed?: boolean,
) => [RefObject<Set<string>>, UseInfiniteQueryResult<(string | number | BaseItemDto)[]>] = (
	artistId,
	sortBy,
	sortOrder,
	isFavoritesParam,
	isUnplayedParam,
) => {
	const api = getApi()
	const user = getUser()
	const [library] = useJellifyLibrary()
	const {
		filters,
		sortBy: librarySortByState,
		sortDescending: librarySortDescendingState,
	} = useLibraryStore()
	const librarySortBy = librarySortByState.tracks ?? undefined
	const isLibrarySortDescending = librarySortDescendingState.tracks ?? false
	const isLibraryFavorites = filters.tracks.isFavorites
	const isDownloaded = filters.tracks.isDownloaded ?? false
	const isLibraryUnplayed = filters.tracks.isUnplayed ?? false
	const libraryGenreIds = filters.tracks.genreIds
	const libraryYearMin = filters.tracks.yearMin
	const libraryYearMax = filters.tracks.yearMax

	// Use provided values or fallback to library context
	// If artistId is present, we use isFavoritesParam if provided, otherwise false (default to showing all artist tracks)
	// If artistId is NOT present, we use isFavoritesParam if provided, otherwise fallback to library context
	const isFavorites =
		isFavoritesParam !== undefined
			? isFavoritesParam
			: artistId
				? undefined
				: isLibraryFavorites
	const isUnplayed =
		isUnplayedParam !== undefined ? isUnplayedParam : artistId ? undefined : isLibraryUnplayed
	const finalSortBy = librarySortBy ?? sortBy ?? ItemSortBy.Name
	const finalSortOrder =
		sortOrder ?? (isLibrarySortDescending ? SortOrder.Descending : SortOrder.Ascending)

	const { data: downloadedTracks } = useAllDownloadedTracks()

	const trackPageParams = useRef<Set<string>>(new Set<string>())

	const selectTracks = (data: InfiniteData<BaseItemDto[], unknown>) => {
		if (
			finalSortBy === ItemSortBy.SortName ||
			finalSortBy === ItemSortBy.Name ||
			finalSortBy === ItemSortBy.Album ||
			finalSortBy === ItemSortBy.Artist
		) {
			return flattenInfiniteQueryPages(data, trackPageParams, {
				sortBy:
					finalSortBy === ItemSortBy.Artist
						? ItemSortBy.Artist
						: finalSortBy === ItemSortBy.Album
							? ItemSortBy.Album
							: undefined,
			})
		}
		return data.pages.flatMap((page) => page)
	}

	const tracksInfiniteQuery = useInfiniteQuery({
		queryKey: TracksQueryKey(
			isFavorites === true,
			isDownloaded,
			isUnplayed === true,
			finalSortOrder === SortOrder.Descending,
			library,
			downloadedTracks?.length,
			artistId,
			finalSortBy,
			finalSortOrder,
			isDownloaded ? undefined : libraryGenreIds,
			libraryYearMin,
			libraryYearMax,
		),
		queryFn: ({ pageParam }) => {
			if (!isDownloaded) {
				return fetchTracks(
					api,
					user,
					library,
					pageParam,
					isFavorites,
					isUnplayed,
					finalSortBy,
					finalSortOrder,
					artistId,
					libraryGenreIds,
					libraryYearMin,
					libraryYearMax,
				)
			} else {
				let items = (downloadedTracks ?? []).map(({ item }) => item)
				if (libraryYearMin != null || libraryYearMax != null) {
					const min = libraryYearMin ?? 0
					const max = libraryYearMax ?? new Date().getFullYear()
					items = items.filter((track) => {
						const y =
							'ProductionYear' in track
								? (track as BaseItemDto).ProductionYear
								: undefined
						if (y == null) return false
						return y >= min && y <= max
					})
				}
				const sortByForCompare =
					finalSortBy === ItemSortBy.SortName ? ItemSortBy.Name : finalSortBy
				items = items.sort((a, b) =>
					compareDownloadedTracks(a, b, sortByForCompare, finalSortOrder),
				)
				return items.filter((track) => {
					if (!isFavorites) return true
					else return isDownloadedTrackAlsoFavorite(user, track)
				})
			}
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

function getSortValue(item: BaseItemDto, sortBy: ItemSortBy): string | number {
	switch (sortBy) {
		case ItemSortBy.Name:
		case ItemSortBy.SortName:
			return item.Name ?? item.SortName ?? ''
		case ItemSortBy.Album:
			return item.Album ?? ''
		case ItemSortBy.Artist:
			return item.AlbumArtist ?? item.Artists?.[0] ?? ''
		case ItemSortBy.DateCreated:
			return item.DateCreated ? new Date(item.DateCreated).getTime() : 0
		case ItemSortBy.PlayCount:
			return item.UserData?.PlayCount ?? 0
		case ItemSortBy.PremiereDate:
			return item.PremiereDate ? new Date(item.PremiereDate).getTime() : 0
		case ItemSortBy.Runtime:
			return item.RunTimeTicks ?? 0
		default:
			return item.Name ?? item.SortName ?? ''
	}
}

function compareDownloadedTracks(
	a: BaseItemDto,
	b: BaseItemDto,
	sortBy: ItemSortBy,
	sortOrder: SortOrder,
): number {
	const aVal = getSortValue(a, sortBy)
	const bVal = getSortValue(b, sortBy)
	const isDesc = sortOrder === SortOrder.Descending
	let cmp: number
	if (typeof aVal === 'number' && typeof bVal === 'number') {
		cmp = aVal - bVal
	} else {
		const aStr = String(aVal)
		const bStr = String(bVal)
		cmp = aStr.localeCompare(bStr, undefined, { sensitivity: 'base' })
	}
	return isDesc ? -cmp : cmp
}
