import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client'

enum ArtistQueryKeys {
	ArtistById = 'ARTIST_BY_ID',
	ArtistAlbums = 'ARTIST_ALBUMS',
	AlbumArtists = 'INFINITE_ALBUM_ARTISTS',
}

export const ArtistQueryKey = (artistId: string | undefined | null) => [
	ArtistQueryKeys.ArtistById,
	artistId,
]

export const ArtistAlbumsQueryKey = (artistId: string | undefined | null) => [
	ArtistQueryKeys.ArtistAlbums,
	artistId,
]

export const AlbumArtistsQueryKey = (
	musicLibraryId: string | undefined,
	isFavorites: boolean | undefined,
	sortDescending: boolean,
	sortBy: ItemSortBy,
	pageLetter?: string,
) => {
	return [
		ArtistQueryKeys.AlbumArtists,
		musicLibraryId,
		isFavorites,
		sortDescending,
		sortBy,
	].concat(pageLetter ? [pageLetter] : [])
}
