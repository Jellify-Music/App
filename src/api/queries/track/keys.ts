import { JellifyLibrary } from '@/src/types/JellifyLibrary'

enum TrackQueryKeys {
	AllTracks = 'ALL_TRACKS',
	PlaylistTracks = 'PLAYLIST_TRACKS',
}

export const TracksQueryKey = (
	isFavorites: boolean,
	sortDescending: boolean,
	library: JellifyLibrary | undefined,
) => [TrackQueryKeys.AllTracks, library?.musicLibraryId, isFavorites, sortDescending]
