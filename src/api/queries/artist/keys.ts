enum ArtistQueryKeys {
	TopTracks = 'TOP_ARTIST_TRACKS',
}

export const ArtistTopTracksQueryKey = (
	libraryId: string | undefined,
	artistId: string | undefined,
) => [ArtistQueryKeys.TopTracks, libraryId, artistId]
