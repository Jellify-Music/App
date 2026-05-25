import { QueryKeys } from '../../../enums/query-keys'
import { BaseItemDto, SortOrder } from '@jellyfin/sdk/lib/generated-client'
import { InfiniteData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { isUndefined } from 'lodash'
import { fetchArtistFeaturedOn, fetchArtists } from './utils/artist'
import { MaxPages } from '../../../configs/query.config'
import { useJellifyLibrary } from '../../../stores/auth'
import { getApi } from '../../../stores/auth/utils'
import useLibraryStore from '../../../stores/library'
import { fetchItem } from '../item'
import { AlbumArtistsQueryKey, ArtistQueryKey } from './keys'
import { artistAlbumsQuery } from './queries'
import AlphabeticalPageParam, { AlphabeticalPage } from '../../types/page-params'
import {
	getNextAlphabeticalPageParam,
	getPreviousAlphabeticalPageParam,
} from '../../utils/infinite-queries'
import { alphabet } from '../../../constants/alphabet'
import useArtistLibraryStore from '../../../stores/library/artist'

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
	const [library] = useJellifyLibrary()

	const { pendingLetter: initialPageParam, setPendingLetter } = useArtistLibraryStore()

	const { filters, sortBy, sortDescending: librarySortDescendingState } = useLibraryStore()

	const sortDescending = librarySortDescendingState.artists ?? false
	const isFavorites = filters.artists.isFavorites

	const select = (data: InfiniteData<BaseItemDto[], AlphabeticalPageParam>) => {
		const pages = data.pages.reduce<AlphabeticalPage[]>((sections, page, index) => {
			const letter = data.pageParams[index]?.letter ?? alphabet[0]
			const existingSection = sections.find((section) => section.title === letter)

			if (existingSection) {
				existingSection.data = existingSection.data.concat(page)
			} else {
				sections.push({
					title: letter,
					data: page,
				})
			}

			return sections
		}, [])

		return {
			...data,
			pages,
		}
	}

	return useInfiniteQuery({
		queryKey: AlbumArtistsQueryKey(
			library?.musicLibraryId,
			isFavorites,
			sortDescending,
			sortBy.artists,
			initialPageParam.letter,
		),
		queryFn: async ({ pageParam }: { pageParam: AlphabeticalPageParam }) =>
			new Promise<BaseItemDto[]>((resolve, reject) => {
				fetchArtists(
					pageParam,
					isFavorites,
					[sortBy.artists],
					[sortDescending ? SortOrder.Descending : SortOrder.Ascending],
				)
					.then((items) => {
						resolve(items)
					})
					.catch((error) => {
						reject(error)
					})
			}),
		select: select,
		maxPages: MaxPages.Library,
		initialPageParam,
		getNextPageParam: getNextAlphabeticalPageParam,
		getPreviousPageParam: getPreviousAlphabeticalPageParam,
	})
}
