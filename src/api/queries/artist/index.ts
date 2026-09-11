import { QueryKeys } from '../../../enums/query-keys'
import { BaseItemDto, SortOrder } from '@jellyfin/sdk/lib/generated-client'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { isUndefined, uniqBy } from 'lodash'
import { fetchArtistFeaturedOn, fetchArtists } from './utils/artist'
import { ApiLimits, MaxPages } from '../../../configs/querying/index.config'
import { useJellifyLibrary, useJellifyUser } from '../../../stores/auth'
import { getApi } from '../../../stores/auth/utils'
import { fetchItem } from '../item'
import { ArtistQueryKey } from './keys'
import { artistAlbumsQuery } from './queries'
import { ArtistsSortBy } from '@/src/types/sorting/artist'
import ArtistsSortByConfig from '../../../configs/sorting/artist'

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

	return useQuery(artistAlbumsQuery(artist, library))
}

export const useArtistFeaturedOn = (artist: BaseItemDto) => {
	const [library] = useJellifyLibrary()

	return useQuery({
		queryKey: [QueryKeys.ArtistFeaturedOn, library?.musicLibraryId, artist.Id],
		queryFn: ({ signal }) => fetchArtistFeaturedOn(library?.musicLibraryId, artist, signal),
		enabled: !isUndefined(artist.Id),
	})
}

export const useAlbumArtists = (
	isFavorites: true | undefined,
	sortBy: ArtistsSortBy,
	sortOrder: SortOrder,
) => {
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()

	const queryKey = [
		QueryKeys.InfiniteArtists,
		isFavorites,
		sortBy,
		sortOrder,
		library?.musicLibraryId,
	]

	return useInfiniteQuery({
		queryKey,
		queryFn: ({ pageParam, signal }: { pageParam: number; signal?: AbortSignal }) =>
			fetchArtists(user, library, pageParam, isFavorites, sortBy, sortOrder, signal),
		maxPages: MaxPages.Library,
		initialPageParam: 0,
		select: ({ pages }) =>
			uniqBy(
				pages.flatMap((page) => page),
				'Id',
			),
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) =>
			getNextAlbumArtistsPageParam(lastPage, lastPageParam, sortBy),
		getPreviousPageParam: (firstPage, allPages, firstPageParam, allPageParams) => {
			return firstPageParam <= 0 ? null : Math.max(0, firstPageParam - ApiLimits.Library)
		},
	})
}

function getNextAlbumArtistsPageParam(
	lastPage: BaseItemDto[],
	lastPageParam: number,
	sortBy: ArtistsSortBy,
): number | undefined {
	let nextPageParam: number | undefined

	switch (sortBy) {
		case ArtistsSortByConfig.DateLastContentAdded:
		case ArtistsSortByConfig.DatePlayed:
			nextPageParam = lastPage.length > 0 ? lastPageParam + 1 : undefined
			break

		default:
		case ArtistsSortByConfig.SortName:
			nextPageParam =
				lastPage?.length === ApiLimits.Library
					? lastPageParam + ApiLimits.Library
					: undefined
	}

	return nextPageParam
}
