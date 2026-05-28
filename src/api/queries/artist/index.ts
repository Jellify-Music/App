import { QueryKeys } from '../../../enums/query-keys'
import { BaseItemDto, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client'
import {
	InfiniteData,
	useInfiniteQuery,
	UseInfiniteQueryResult,
	useQuery,
} from '@tanstack/react-query'
import { isUndefined } from 'lodash'
import { fetchArtistFeaturedOn, fetchArtists } from './utils/artist'
import { ApiLimits, MaxPages } from '../../../configs/query.config'
import { RefObject, useRef } from 'react'
import flattenInfiniteQueryPages from '../../../utils/query-selectors'
import { useJellifyLibrary, useJellifyUser } from '../../../stores/auth'
import { getApi } from '../../../stores/auth/utils'
import useLibraryStore from '../../../stores/library'
import { fetchItem } from '../item'
import { AlbumArtistsQueryKey, ArtistQueryKey } from './keys'
import { artistAlbumsQuery } from './queries'
import {
	getNextAlphabeticalPageParam,
	getPreviousAlphabeticalPageParam,
	initialAlphabeticalPageParam,
} from '../../utils/infinite-queries'
import AlphabeticalPageParam from '../../types/page-params'
import { useArtistLibraryStore } from '../../../stores/library/artists'

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

export const useAlbumArtists: () => UseInfiniteQueryResult<
	{
		title: string
		data: BaseItemDto[]
	}[],
	Error
> = () => {
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()

	const { sortBy, sortDescending } = useArtistLibraryStore()

	const { filters } = useLibraryStore()

	const isFavorites = filters.artists.isFavorites

	const artistPageParams = useRef<Set<string>>(new Set<string>())

	// Only add letter sections when sorting by name (for A-Z selector)
	const selectArtists = (data: InfiniteData<BaseItemDto[], AlphabeticalPageParam>) => {
		return flattenInfiniteQueryPages(data, artistPageParams)
	}

	return useInfiniteQuery({
		queryKey: AlbumArtistsQueryKey(isFavorites, sortDescending, library, sortBy),
		queryFn: ({ pageParam }: { pageParam: AlphabeticalPageParam }) =>
			fetchArtists(
				user,
				library,
				pageParam,
				isFavorites,
				[sortBy],
				[sortDescending ? SortOrder.Descending : SortOrder.Ascending],
			),
		select: selectArtists,
		maxPages: 5,
		initialPageParam: initialAlphabeticalPageParam,
		getNextPageParam: getNextAlphabeticalPageParam,
		getPreviousPageParam: getPreviousAlphabeticalPageParam,
	})
}
