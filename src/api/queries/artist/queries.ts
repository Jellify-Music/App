import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { ArtistAlbumsQueryKey, ArtistQueryKey } from './keys'
import type { BaseItemDtoQueryOptions } from '../../types/query'
import { fetchArtistAlbums } from './utils/artist'
import { getLibrary } from '../../../stores/auth/utils'
import { JellifyLibrary } from '../../../types/JellifyLibrary'
import { QueryAges } from '../../../constants/durations'
import { fetchItem } from '../item'

export const artistQuery: (artistId: BaseItemDto['Id']) => BaseItemDtoQueryOptions = (
	artistId: BaseItemDto['Id'],
) => ({
	queryKey: ArtistQueryKey(artistId),
	queryFn: ({ signal }) => fetchItem(artistId, signal),
})

export const artistAlbumsQuery = (
	artist: BaseItemDto,
	library: JellifyLibrary | undefined = getLibrary(),
) => {
	return {
		queryKey: ArtistAlbumsQueryKey(artist.Id, library?.musicLibraryId),
		queryFn: ({ signal }: { signal: AbortSignal }) =>
			fetchArtistAlbums(artist, library?.musicLibraryId, signal),
		enabled: Boolean(artist.Id),
		gcTime: QueryAges.OneWeek,
	}
}
