enum ArtistQueryKeys {
	ArtistById = 'ARTIST_BY_ID',
	ArtistAlbums = 'ARTIST_ALBUMS',
}

export const ArtistQueryKey = (artistId: string | undefined | null) => [
	ArtistQueryKeys.ArtistById,
	artistId,
]

export const ArtistAlbumsQueryKey = (artistId: string | undefined | null) => [
	ArtistQueryKeys.ArtistAlbums,
	artistId,
]
