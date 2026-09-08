import { QueryKeys } from '../../../enums/query-keys'
import { BaseItemDto, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client'
import { InfiniteData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { isUndefined } from 'lodash'
import { fetchArtistFeaturedOn, fetchArtists, fetchArtistsCountBeforeLetter } from './utils/artist'
import { ApiLimits, MaxPages } from '../../../configs/querying/index.config'
import flattenInfiniteQueryPages from '../../../utils/query-selectors'
import { useJellifyLibrary, useJellifyUser } from '../../../stores/auth'
import { getApi } from '../../../stores/auth/utils'
import useLibraryStore from '../../../stores/library'
import { fetchItem } from '../item'
import { ArtistQueryKey } from './keys'
import { artistAlbumsQuery } from './queries'
import { LetterCursor } from '../../../types/LetterCursor'

export const useArtist = (artistId: string | undefined | null) => {
	const api = getApi()

	return useQuery({
		queryKey: ArtistQueryKey(artistId),
		queryFn: ({ signal }) => fetchItem(api, artistId!, signal),
		enabled: !!artistId,
	})
}

export const useArtistAlbums = (artist: BaseItemDto) => {
	const [library] = useJellifyLibrary()

	return useQuery(artistAlbumsQuery(library!, artist))
}

export const useArtistFeaturedOn = (artist: BaseItemDto) => {
	const [library] = useJellifyLibrary()

	return useQuery({
		queryKey: [QueryKeys.ArtistFeaturedOn, library?.musicLibraryId, artist.Id],
		queryFn: ({ signal }) => fetchArtistFeaturedOn(library?.musicLibraryId, artist, signal),
		enabled: !isUndefined(artist.Id),
	})
}

export const useAlbumArtists = () => {
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()

	const { filters, sortDescending: librarySortDescendingState } = useLibraryStore()
	const sortDescending = librarySortDescendingState.artists ?? false
	const isFavorites = filters.artists.isFavorites

	const selectArtists = (data: InfiniteData<BaseItemDto[], unknown>) => {
		return flattenInfiniteQueryPages(data)
	}

	const queryKey = [
		QueryKeys.InfiniteArtists,
		isFavorites,
		sortDescending,
		library?.musicLibraryId,
	]

	const query = useInfiniteQuery({
		queryKey,
		queryFn: ({ pageParam, signal }: { pageParam: number; signal?: AbortSignal }) =>
			fetchArtists(
				user,
				library,
				pageParam,
				isFavorites,
				[ItemSortBy.SortName],
				[sortDescending ? SortOrder.Descending : SortOrder.Ascending],
				signal,
			),
		select: selectArtists,
		maxPages: MaxPages.Library,
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			return lastPage.length === ApiLimits.Library ? lastPageParam + 1 : undefined
		},
		getPreviousPageParam: (firstPage, allPages, firstPageParam, allPageParams) => {
			return firstPageParam === 0 ? null : firstPageParam - 1
		},
	})

	// Lets the A-Z scroller jump straight to the page containing a given letter
	const letterCursor: LetterCursor = {
		queryKey,
		fetchPage: (page, signal) =>
			fetchArtists(
				user,
				library,
				page,
				isFavorites,
				[ItemSortBy.SortName],
				[sortDescending ? SortOrder.Descending : SortOrder.Ascending],
				signal,
			),
		countBeforeLetter: (letter, signal) =>
			fetchArtistsCountBeforeLetter(user, library, letter, isFavorites, signal),
	}

	return Object.assign(query, { letterCursor })
}
