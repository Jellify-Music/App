import { JellifyLibrary } from '@/src/types/JellifyLibrary'
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
	isFavorites: boolean | undefined,
	sortDescending: boolean,
	library: JellifyLibrary | undefined,
	librarySortBy: ItemSortBy,
) => [
	ArtistQueryKeys.AlbumArtists,
	isFavorites,
	sortDescending,
	library?.musicLibraryId,
	librarySortBy,
]
