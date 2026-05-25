import { BaseItemDto, SortOrder } from '@jellyfin/sdk/lib/generated-client'
import { isUndefined } from 'lodash'
import { AlbumArtistsQueryKey, ArtistAlbumsQueryKey } from './keys'
import { JellifyLibrary } from '@/src/types/JellifyLibrary'
import { fetchArtistAlbums, fetchArtists } from './utils/artist'
import { queryClient } from '../../../constants/query-client'
import { getLibrary } from '../../../stores/auth/utils'
import useArtistLibraryStore from '../../../stores/library/artist'
import { getNextAlphabeticalPageParam } from '../../utils/infinite-queries'
import AlphabeticalPageParam from '../../types/page-params'

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
	const library = getLibrary()

	const { sortBy, sortDescending, isFavorites } = useArtistLibraryStore.getState()

	return await queryClient.ensureInfiniteQueryData({
		queryKey: AlbumArtistsQueryKey(
			library?.musicLibraryId,
			isFavorites,
			sortDescending,
			sortBy,
			letter,
		),
		queryFn: ({ pageParam }: { pageParam: AlphabeticalPageParam }) =>
			fetchArtists(
				pageParam,
				isFavorites,
				[sortBy],
				[sortDescending ? SortOrder.Descending : SortOrder.Ascending],
			),
		maxPages: 1,
		initialPageParam: { letter, page: 0 },
		getNextPageParam: getNextAlphabeticalPageParam,
	})
}
