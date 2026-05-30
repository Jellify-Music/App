import { QueryKeys } from '../../../enums/query-keys'
import { BaseItemDto, SortOrder } from '@jellyfin/sdk/lib/generated-client'
import {
	InfiniteData,
	useInfiniteQuery,
	UseInfiniteQueryResult,
	useQuery,
} from '@tanstack/react-query'
import { isUndefined } from 'lodash'
import { fetchArtistFeaturedOn, fetchArtists } from './utils/artist'
import { RefObject } from 'react'
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

export const useAlbumArtists: (letter: RefObject<string | null>) => UseInfiniteQueryResult<
	{
		title: string
		data: BaseItemDto[]
	}[],
	Error
> = ({ current: letter }) => {
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()

	const { sortBy, sortDescending } = useArtistLibraryStore()

	const { filters } = useLibraryStore()

	const isFavorites = filters.artists.isFavorites

	// Only add letter sections when sorting by name (for A-Z selector)
	const selectArtists = (data: InfiniteData<BaseItemDto[], AlphabeticalPageParam>) => {
		return flattenInfiniteQueryPages(data)
	}

	return useInfiniteQuery({
		queryKey: AlbumArtistsQueryKey(isFavorites, sortDescending, library, sortBy),
		queryFn: ({ pageParam }: { pageParam: AlphabeticalPageParam }) =>
			fetchArtists(
				user,
				library,
				letter ? { letter, page: 0 } : pageParam,
				isFavorites,
				[sortBy],
				[sortDescending ? SortOrder.Descending : SortOrder.Ascending],
			),
		select: selectArtists,
		maxPages: 5,
		initialPageParam: letter ? { letter, page: 0 } : initialAlphabeticalPageParam,
		getNextPageParam: getNextAlphabeticalPageParam,
		getPreviousPageParam: getPreviousAlphabeticalPageParam,
	})
}
