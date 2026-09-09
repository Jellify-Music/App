import { QueryKeys } from '../../../enums/query-keys'
import { BaseItemDto, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client'
import { InfiniteData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { isUndefined } from 'lodash'
import { fetchArtistFeaturedOn, fetchArtists, fetchArtistsCount } from './utils/artist'
import { ApiLimits, MaxPages } from '../../../configs/querying/index.config'
import flattenInfiniteQueryPages from '../../../utils/query-selectors'
import { queryClient } from '../../../constants/query-client'
import { useJellifyLibrary, useJellifyUser } from '../../../stores/auth'
import { getApi } from '../../../stores/auth/utils'
import useLibraryStore from '../../../stores/library'
import { fetchItem } from '../item'
import { ArtistQueryKey } from './keys'
import { artistAlbumsQuery } from './queries'

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

	/**
	 * Jumps the artists list directly to {@link letter} by computing its absolute index from the
	 * artist counts before/after it, then seeding the query cache with that single page - no
	 * incremental fetchNextPage/fetchPreviousPage looping required.
	 */
	const jumpToLetter = async (letter: string, letterReverseOrder: boolean): Promise<boolean> => {
		if (!user || !library) return false

		try {
			const target = letter.toUpperCase()

			const [countBelowTarget, totalCount] = await Promise.all([
				fetchArtistsCount(user, library, isFavorites, target),
				fetchArtistsCount(user, library, isFavorites),
			])

			const startIndex = letterReverseOrder
				? Math.max(0, totalCount - countBelowTarget)
				: countBelowTarget

			const items = await fetchArtists(
				user,
				library,
				startIndex,
				isFavorites,
				[ItemSortBy.SortName],
				[letterReverseOrder ? SortOrder.Descending : SortOrder.Ascending],
			)

			queryClient.setQueryData(queryKey, { pages: [items], pageParams: [startIndex] })
			return true
		} catch {
			return false
		}
	}

	return {
		...useInfiniteQuery({
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
				return lastPage.length === ApiLimits.Library
					? lastPageParam + ApiLimits.Library
					: undefined
			},
			getPreviousPageParam: (firstPage, allPages, firstPageParam, allPageParams) => {
				return firstPageParam <= 0 ? null : Math.max(0, firstPageParam - ApiLimits.Library)
			},
		}),
		jumpToLetter,
	}
}
