import { JellifyLibrary } from '@/src/types/JellifyLibrary'

enum TrackQueryKeys {
	AllTracks = 'ALL_TRACKS',
	PlaylistTracks = 'PLAYLIST_TRACKS',
}

export const TracksQueryKey = (
	isFavorites: boolean,
	isDownloaded: boolean,
	sortDescending: boolean,
	library: JellifyLibrary | undefined,
	downloads: number | undefined,
) => [
	TrackQueryKeys.AllTracks,
	library?.musicLibraryId,
	isFavorites,
	isDownloaded ? `${isDownloaded} - ${downloads}` : isDownloaded,
	sortDescending,
]
