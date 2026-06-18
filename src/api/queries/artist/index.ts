import { QueryKeys } from '../../../enums/query-keys'
import { BaseItemDto, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client'
import { InfiniteData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { isUndefined } from 'lodash'
import { fetchArtistFeaturedOn, fetchArtists } from './utils/artist'
import { ApiLimits, MaxPages } from '../../../configs/query.config'
import flattenInfiniteQueryPages from '../../../utils/query-selectors'
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
		queryFn: () => fetchItem(api, artistId!),
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
		queryFn: () => fetchArtistFeaturedOn(library?.musicLibraryId, artist),
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

	return useInfiniteQuery({
		queryKey: [QueryKeys.InfiniteArtists, isFavorites, sortDescending, library?.musicLibraryId],
		queryFn: ({ pageParam }: { pageParam: number }) =>
			fetchArtists(
				user,
				library,
				pageParam,
				isFavorites,
				[ItemSortBy.SortName],
				[sortDescending ? SortOrder.Descending : SortOrder.Ascending],
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
}
