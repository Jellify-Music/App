import { BaseItemDto, SortOrder } from '@jellyfin/sdk/lib/generated-client'
import { isUndefined } from 'lodash'
import { AlbumArtistsQueryKey, ArtistAlbumsQueryKey } from './keys'
import { JellifyLibrary } from '@/src/types/JellifyLibrary'
import { fetchArtistAlbums, fetchArtists } from './utils/artist'
import { queryClient } from '../../../constants/query-client'
import { getLibrary, getUser } from '../../../stores/auth/utils'
import { useArtistLibraryStore } from '../../../stores/library/artists'
import AlphabeticalPageParam from '../../types/page-params'
import { sortifyItemArrays, sortifyParams } from '../../utils/infinite-queries'
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

export async function ensureAlbumArtistsAtPage(letter: string) {
	const user = getUser()
	const library = getLibrary()
	const { isFavorites, sortBy, sortDescending } = useArtistLibraryStore.getState()

	console.debug(`Ensuring album artists at letter '${letter}'`)

	const pageParam = {
		page: 0,
		letter: letter.toUpperCase(),
	}

	const section = await fetchArtists(
		user,
		library,
		pageParam,
		isFavorites,
		[sortBy],
		sortDescending ? [SortOrder.Descending] : [SortOrder.Ascending],
	)

	queryClient.setQueryData<InfiniteData<BaseItemDto[], AlphabeticalPageParam>>(
		AlbumArtistsQueryKey(isFavorites, sortDescending, library, sortBy),
		(prev) => {
			if (!prev)
				return {
					lastPageParam: pageParam,
					pageParams: [pageParam],
					pages: [section],
				}
			else
				return {
					lastPageParam: pageParam,
					pageParams: prev.pageParams
						.concat(pageParam)
						.sort((a, b) => sortifyParams(a, b, sortDescending)),
					pages: prev.pages
						.concat(section)
						.sort((a, b) => sortifyItemArrays(a, b, sortDescending)),
				}
		},
	)
}
