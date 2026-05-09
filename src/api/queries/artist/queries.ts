import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { isUndefined } from 'lodash'
import { ArtistAlbumsQueryKey } from './keys'
import { JellifyLibrary } from '@/src/types/JellifyLibrary'
import { fetchArtistAlbums } from './utils/artist'
import { queryClient } from '../../../constants/query-client'
import { getLibrary } from '../../../stores'

export const artistAlbumsQuery = (library: JellifyLibrary, artist: BaseItemDto) => ({
	queryKey: ArtistAlbumsQueryKey(artist.Id),
	queryFn: () => fetchArtistAlbums(library?.musicLibraryId, artist),
	enabled: !isUndefined(artist.Id),
})

export async function ensureArtistAlbumsQueryData(artist: BaseItemDto) {
	const library = getLibrary()
	return await queryClient.ensureQueryData(artistAlbumsQuery(library!, artist))
}
