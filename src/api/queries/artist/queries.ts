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
