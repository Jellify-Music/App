import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { isUndefined } from 'lodash'
import { ArtistAlbumsQueryKey } from './keys'
import { JellifyLibrary } from '@/src/types/JellifyLibrary'
import { fetchArtistAlbums } from './utils/artist'
import { queryClient } from '../../../constants/query-client'
import { getLibrary } from '../../../stores/auth/utils'

export const artistAlbumsQuery = (library: JellifyLibrary, artist: BaseItemDto) => ({
	queryKey: ArtistAlbumsQueryKey(artist.Id),
	queryFn: ({ signal }: { signal: AbortSignal }) =>
		fetchArtistAlbums(library?.musicLibraryId, artist, signal),
	enabled: !isUndefined(artist.Id),
})

/**
 * The artist's albums. Cached data is returned whatever its age (`'static'`), unless
 * `staleTime` is given: Android Auto asks for a short window because a car has no way to
 * pull to refresh.
 */
export async function ensureArtistAlbumsQueryData(artist: BaseItemDto, staleTime?: number) {
	const library = getLibrary()
	const query = artistAlbumsQuery(library!, artist)
	return await queryClient.query({ ...query, staleTime: staleTime ?? 'static' })
}
