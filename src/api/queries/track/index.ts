import { InfiniteData, useInfiniteQuery, UseInfiniteQueryResult } from '@tanstack/react-query'
import { TracksQueryKey } from './keys'
import fetchTracks from './utils'
import {
	BaseItemDto,
	ItemSortBy,
	SortOrder,
	UserItemDataDto,
} from '@jellyfin/sdk/lib/generated-client'
import { RefObject, useRef, useState } from 'react'
import flattenInfiniteQueryPages from '../../../utils/query-selectors'
import { ApiLimits, MaxPages } from '../../../configs/query.config'
import { useAllDownloadedTracks } from '../download'
import { queryClient } from '../../../constants/query-client'
import UserDataQueryKey from '../user-data/keys'
import { JellifyUser } from '@/src/types/JellifyUser'
import { useJellifyLibrary, getApi, getUser } from '../../../stores'
import useLibraryStore from '../../../stores/library'
import { QueryKeys } from '../../../enums/query-keys'

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
				)
			} else
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

export interface LetterAnchoredTracksResult {
	data: (string | BaseItemDto)[]
	letters: Set<string>
	anchorLetter: string | null
	setAnchorLetter: (letter: string | null) => void
	fetchNextPage: () => void
	hasNextPage: boolean
	fetchPreviousPage: () => void
	hasPreviousPage: boolean
	isFetching: boolean
	isPending: boolean
	refetch: () => void
	anchorIndex: number
}

export const useLetterAnchoredTracks = (): LetterAnchoredTracksResult => {
	const api = getApi()
	const user = getUser()
	const [library] = useJellifyLibrary()

	const { filters } = useLibraryStore()
	const isFavorites = filters.tracks.isFavorites
	const isUnplayed = filters.tracks.isUnplayed
	const genreIds = filters.tracks.genreIds

	const [anchorLetter, setAnchorLetter] = useState<string | null>(null)

	const forwardQuery = useInfiniteQuery({
		queryKey: [
			QueryKeys.InfiniteTracks,
			'forward',
			anchorLetter,
			isFavorites,
			isUnplayed,
			genreIds,
			library?.musicLibraryId,
		],
		queryFn: ({ pageParam }: { pageParam: number }) =>
			fetchTracks(
				api,
				user,
				library,
				pageParam,
				isFavorites,
				isUnplayed,
				ItemSortBy.Name,
				SortOrder.Ascending,
				undefined, // artistId
				genreIds,
				anchorLetter ? { nameStartsWithOrGreater: anchorLetter } : undefined,
			),
		maxPages: MaxPages.Library,
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam) => {
			return lastPage.length === ApiLimits.Library ? lastPageParam + 1 : undefined
		},
		staleTime: Infinity,
	})

	const backwardQuery = useInfiniteQuery({
		queryKey: [
			QueryKeys.InfiniteTracks,
			'backward',
			anchorLetter,
			isFavorites,
			isUnplayed,
			genreIds,
			library?.musicLibraryId,
		],
		queryFn: ({ pageParam }: { pageParam: number }) =>
			fetchTracks(
				api,
				user,
				library,
				pageParam,
				isFavorites,
				isUnplayed,
				ItemSortBy.Name,
				SortOrder.Descending,
				undefined,
				genreIds,
				{ nameLessThan: anchorLetter! },
			),
		enabled: anchorLetter !== null,
		maxPages: MaxPages.Library,
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam) => {
			return lastPage.length === ApiLimits.Library ? lastPageParam + 1 : undefined
		},
		staleTime: Infinity,
	})

	// For tracks, we use Name instead of SortName (see comment in fetchTracks)
	const seenLetters = new Set<string>()
	const mergedData: (string | BaseItemDto)[] = []

	const backwardItems = backwardQuery.data?.pages.flat().reverse() ?? []
	backwardItems.forEach((item: BaseItemDto) => {
		const rawLetter = item.Name?.trim().charAt(0).toUpperCase() ?? '#'
		const letter = rawLetter.match(/[A-Z]/) ? rawLetter : '#'

		if (!seenLetters.has(letter)) {
			seenLetters.add(letter)
			mergedData.push(letter)
		}
		mergedData.push(item)
	})

	const anchorIndex = mergedData.length

	const forwardItems = forwardQuery.data?.pages.flat() ?? []
	forwardItems.forEach((item: BaseItemDto) => {
		const rawLetter = item.Name?.trim().charAt(0).toUpperCase() ?? '#'
		const letter = rawLetter.match(/[A-Z]/) ? rawLetter : '#'

		if (!seenLetters.has(letter)) {
			seenLetters.add(letter)
			mergedData.push(letter)
		}
		mergedData.push(item)
	})

	const handleSetAnchorLetter = (letter: string | null) => {
		if (letter === '#') {
			setAnchorLetter(null)
		} else {
			setAnchorLetter(letter?.toUpperCase() ?? null)
		}
	}

	const refetch = () => {
		forwardQuery.refetch()
		if (anchorLetter) backwardQuery.refetch()
	}

	return {
		data: mergedData,
		letters: seenLetters,
		anchorLetter,
		setAnchorLetter: handleSetAnchorLetter,
		fetchNextPage: forwardQuery.fetchNextPage,
		hasNextPage: forwardQuery.hasNextPage ?? false,
		fetchPreviousPage: backwardQuery.fetchNextPage,
		hasPreviousPage: (anchorLetter !== null && backwardQuery.hasNextPage) ?? false,
		isFetching: forwardQuery.isFetching || backwardQuery.isFetching,
		isPending: forwardQuery.isPending,
		refetch,
		anchorIndex,
	}
}
