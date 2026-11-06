import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'

enum ArtistQueryKeys {
	ArtistById = 'ARTIST_BY_ID',
	ArtistAlbums = 'ARTIST_ALBUMS',
}

export const ArtistQueryKey = (artistId: BaseItemDto['Id']) => [
	ArtistQueryKeys.ArtistById,
	artistId,
]

export const ArtistAlbumsQueryKey = (
	artistId: BaseItemDto['Id'],
	libraryId: string | undefined,
) => [ArtistQueryKeys.ArtistAlbums, artistId, libraryId]
