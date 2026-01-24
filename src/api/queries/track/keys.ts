import { JellifyLibrary } from '@/src/types/JellifyLibrary'

export enum TrackQueryKeys {
	AllTracks = 'ALL_TRACKS',
	PlaylistTracks = 'PLAYLIST_TRACKS',
}

export const TracksQueryKey = (
	isFavorites: boolean,
	isDownloaded: boolean,
	isUnplayed: boolean,
	sortDescending: boolean,
	library: JellifyLibrary | undefined,
	downloads: number | undefined,
	artistId?: string,
	sortBy?: string,
	sortOrder?: string,
) => [
	TrackQueryKeys.AllTracks,
	library?.musicLibraryId,
	`favorites:${isFavorites}`,
	`unplayed:${isUnplayed}`,
	isDownloaded ? `${isDownloaded} - ${downloads}` : isDownloaded,
	sortDescending,
	artistId,
	sortBy,
	sortOrder,
]
