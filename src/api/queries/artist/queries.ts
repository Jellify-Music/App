import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { isUndefined } from 'lodash'
import { ArtistAlbumsQueryKey } from './keys'
import { JellifyLibrary } from '@/src/types/JellifyLibrary'
import { fetchArtistAlbums } from './utils/artist'
import { queryClient } from '../../../constants/query-client'
import { getLibrary } from '../../../stores/auth/utils'

export const artistAlbumsQuery = (artist: BaseItemDto, library?: JellifyLibrary) => ({
	queryKey: ArtistAlbumsQueryKey(artist.Id),
	queryFn: ({ signal }: { signal: AbortSignal }) =>
		fetchArtistAlbums(library?.musicLibraryId, artist, signal),
	enabled: !isUndefined(artist.Id),
})

export async function ensureArtistAlbumsQueryData(artist: BaseItemDto) {
	const library = getLibrary()
	return await queryClient.query({
		...artistAlbumsQuery(artist, library),
		staleTime: 'static',
	})
}
