import { BaseItemDto, SortOrder } from '@jellyfin/sdk/lib/generated-client'
import { isUndefined } from 'lodash'
import { AlbumArtistsQueryKey, ArtistAlbumsQueryKey } from './keys'
import { JellifyLibrary } from '@/src/types/JellifyLibrary'
import { fetchArtistAlbums, fetchArtists } from './utils/artist'
import { queryClient } from '../../../constants/query-client'
import { getLibrary } from '../../../stores/auth/utils'
import useArtistLibraryStore from '../../../stores/library/artist'
import AlphabeticalPageParam from '../../types/page-params'
import { InfiniteData } from '@tanstack/react-query'

export const artistAlbumsQuery = (library: JellifyLibrary, artist: BaseItemDto) => ({
	queryKey: ArtistAlbumsQueryKey(artist.Id),
	queryFn: () => fetchArtistAlbums(library?.musicLibraryId, artist),
	enabled: !isUndefined(artist.Id),
})

export async function ensureArtistAlbumsQueryData(artist: BaseItemDto) {
	const library = getLibrary()
	return await queryClient.ensureQueryData(artistAlbumsQuery(library!, artist))
}

export async function ensureAlbumArtistsAtLetterQueryData(letter: string) {
	console.debug('Ensuring artists exist under letter', letter)

	const pageParam: AlphabeticalPageParam = {
		letter,
		page: 0,
	}

	const library = getLibrary()

	const { sortBy, sortDescending, isFavorites } = useArtistLibraryStore.getState()

	const artists = await fetchArtists(
		pageParam,
		isFavorites,
		[sortBy],
		[sortDescending ? SortOrder.Descending : SortOrder.Ascending],
	)

	queryClient.setQueryData<InfiniteData<BaseItemDto[], AlphabeticalPageParam>>(
		AlbumArtistsQueryKey(library?.musicLibraryId, isFavorites, sortDescending, sortBy),
		(data) => {
			if (!data) {
				return {
					pages: [artists],
					pageParams: [pageParam],
				}
			}

			const existingIndex = data.pageParams.findIndex((p) => p.letter === letter)
			const nextPages = [...data.pages]
			const nextParams = [...data.pageParams]

			if (existingIndex > -1) {
				nextPages[existingIndex] = artists
				nextParams[existingIndex] = pageParam
			} else {
				nextPages.push(artists)
				nextParams.push(pageParam)
			}

			const sortedData = nextPages.map((p, i) => ({ page: p, param: nextParams[i] }))
			sortedData.sort((a, b) => {
				const result = a.param.letter.localeCompare(b.param.letter)
				return sortDescending ? -result : result
			})

			return {
				pages: sortedData.map((z) => z.page),
				pageParams: sortedData.map((z) => z.param),
			}
		},
	)
}
