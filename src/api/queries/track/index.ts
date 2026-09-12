import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query'
import { TracksQueryKey } from './keys'
import fetchTracks, { fetchTracksCount } from './utils'
import {
	BaseItemDto,
	ItemSortBy,
	SortOrder,
	UserItemDataDto,
} from '@jellyfin/sdk/lib/generated-client'
import flattenInfiniteQueryPages from '../../../utils/query-selectors'
import { ApiLimits } from '../../../configs/querying/index.config'
import { queryClient } from '../../../constants/query-client'
import UserDataQueryKey from '../user-data/keys'
import { JellifyUser } from '@/src/types/JellifyUser'
import { useJellifyLibrary } from '../../../stores/auth'
import { getApi, getUser } from '../../../stores/auth/utils'
import useLibraryStore from '../../../stores/library'
import getTrackDto from '../../../utils/mapping/track-extra-payload'
import { useDownloadedTracks } from 'react-native-nitro-player'

const useTracks = (
	sortBy: ItemSortBy,
	sortOrder: SortOrder,
	isFavoritesParam: boolean | undefined,
	isUnplayedParam: boolean | undefined,
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
	const isFavorites = isFavoritesParam !== undefined ? isFavoritesParam : isLibraryFavorites
	const isUnplayed = isUnplayedParam !== undefined ? isUnplayedParam : isLibraryUnplayed
	const finalSortBy = librarySortBy ?? sortBy ?? ItemSortBy.Name
	const finalSortOrder =
		sortOrder ?? (isLibrarySortDescending ? SortOrder.Descending : SortOrder.Ascending)

	const { downloadedTracks } = useDownloadedTracks()

	const selectTracks = (data: InfiniteData<BaseItemDto[], unknown>) => {
		if (finalSortBy === ItemSortBy.SortName || finalSortBy === ItemSortBy.Name) {
			return flattenInfiniteQueryPages(data)
		}
		return data.pages.flatMap((page) => page)
	}

	const queryKey = TracksQueryKey(
		isFavorites === true,
		isDownloaded,
		isUnplayed === true,
		finalSortOrder === SortOrder.Descending,
		library,
		downloadedTracks?.length,
		undefined,
		finalSortBy,
		finalSortOrder,
		isDownloaded ? undefined : libraryGenreIds,
		libraryYearMin,
		libraryYearMax,
	)

	/**
	 * Jumps the tracks list directly to {@link letter}.
	 *
	 * Unlike artists/albums, tracks can't be located via a `nameLessThan`-based count: Jellyfin's
	 * name filters compare against `SortName`, which for tracks is prefixed with disc/track
	 * numbers rather than matching the `Name` field the list actually sorts/groups by. Instead,
	 * this binary searches the (already Name-sorted) results for the letter's boundary index -
	 * O(log n) single-item probes instead of paginating through every page in between.
	 */
	const jumpToLetter = async (letter: string, letterReverseOrder: boolean): Promise<boolean> => {
		if (isDownloaded || !api || !user || !library) return false

		try {
			const target = letter.toUpperCase()

			const letterOf = (item: BaseItemDto): string => {
				const raw = (item.Name ?? '').trim().charAt(0).toUpperCase()
				return /[A-Z]/.test(raw) ? raw : '#'
			}

			// Whether `value` sorts before `target` in the current sort direction
			const isBeforeTarget = (value: string) =>
				letterReverseOrder ? value > target : value < target

			const totalCount = await fetchTracksCount(
				api,
				user,
				library,
				isFavorites,
				isUnplayed,
				undefined,
				libraryGenreIds,
				libraryYearMin,
				libraryYearMax,
			)

			let lo = 0
			let hi = totalCount
			while (lo < hi) {
				const mid = Math.floor((lo + hi) / 2)
				const [probe] = await fetchTracks(
					api,
					user,
					library,
					mid,
					isFavorites,
					isUnplayed,
					finalSortBy,
					finalSortOrder,
					undefined,
					libraryGenreIds,
					libraryYearMin,
					libraryYearMax,
					undefined,
					1,
				)
				if (!probe || isBeforeTarget(letterOf(probe))) lo = mid + 1
				else hi = mid
			}

			const items = await fetchTracks(
				api,
				user,
				library,
				lo,
				isFavorites,
				isUnplayed,
				finalSortBy,
				finalSortOrder,
				undefined,
				libraryGenreIds,
				libraryYearMin,
				libraryYearMax,
			)

			queryClient.setQueryData(queryKey, { pages: [items], pageParams: [lo] })
			return true
		} catch {
			return false
		}
	}

	return {
		...useInfiniteQuery({
			queryKey,
			queryFn: ({ pageParam, signal }) => {
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
						undefined,
						libraryGenreIds,
						libraryYearMin,
						libraryYearMax,
						signal,
					)
				} else {
					let items = (downloadedTracks ?? []).map((download) =>
						getTrackDto(download.originalTrack),
					)

					console.debug('Downloaded tracks before filtering and sorting:', items)

					if (libraryYearMin != null || libraryYearMax != null) {
						const min = libraryYearMin ?? 0
						const max = libraryYearMax ?? new Date().getFullYear()
						items = items
							.filter((track) => track !== undefined)
							.filter((track) => {
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
					items = items
						.filter((track) => track !== undefined)
						.sort((a, b) =>
							compareDownloadedTracks(a, b, sortByForCompare, finalSortOrder),
						)
					return items
						.filter((track) => track !== undefined)
						.filter((track) => {
							if (!isFavorites) return true
							else return isDownloadedTrackAlsoFavorite(user, track.Id)
						})
				}
			},
			initialPageParam: 0,
			getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
				if (isDownloaded) return undefined
				else
					return lastPage.length === ApiLimits.Library
						? lastPageParam + ApiLimits.Library
						: undefined
			},
			getPreviousPageParam: (firstPage, allPages, firstPageParam, allPageParams) => {
				if (isDownloaded) return null
				return firstPageParam <= 0 ? null : Math.max(0, firstPageParam - ApiLimits.Library)
			},
			select: selectTracks,
		}),
		jumpToLetter,
	}
}

export const useArtistTracks = (
	artistId: string,
	sortBy?: ItemSortBy,
	sortOrder?: SortOrder,
	isFavoritesParam?: boolean | undefined,
	isUnplayedParam?: boolean | undefined,
) => {
	const api = getApi()
	const user = getUser()
	const [library] = useJellifyLibrary()

	const selectTracks = (data: InfiniteData<BaseItemDto[], unknown>) => {
		return flattenInfiniteQueryPages(data, {
			sortBy:
				sortBy === ItemSortBy.Artist
					? ItemSortBy.Artist
					: sortBy === ItemSortBy.Album
						? ItemSortBy.Album
						: ItemSortBy.SortName,
		})
	}

	const artistTracksInfiniteQuery = useInfiniteQuery({
		queryKey: TracksQueryKey(
			isFavoritesParam === true,
			false,
			isUnplayedParam === true,
			sortOrder === SortOrder.Descending,
			library,
			undefined,
			artistId,
			sortBy,
			sortOrder,
		),
		queryFn: ({ pageParam }) => {
			return fetchTracks(
				api,
				user,
				library,
				pageParam,
				isFavoritesParam,
				isUnplayedParam,
				sortBy,
				sortOrder,
				artistId,
			)
		},
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			if (!lastPage) return undefined
			return lastPage.length === ApiLimits.Library
				? lastPageParam + ApiLimits.Library
				: undefined
		},
		select: selectTracks,
	})
	return artistTracksInfiniteQuery
}
export default useTracks

function isDownloadedTrackAlsoFavorite(
	user: JellifyUser | undefined,
	trackId: string | null | undefined,
): boolean {
	if (!user) return false

	const userData = queryClient.getQueryData<UserItemDataDto>(UserDataQueryKey(user!, trackId!))

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
