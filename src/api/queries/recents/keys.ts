import { JellifyLibrary } from '../../../types/JellifyLibrary'
import { JellifyUser } from '../../../types/JellifyUser'
import { MusicLibraryQueryKey } from '../libraries/keys'

enum RecentsQueryKeys {
	RecentlyPlayedTracks = 'RECENTLY_PLAYED_TRACKS',
	RecentlyPlayedArtists = 'RECENTLY_PLAYED_ARTISTS',
	RecentlyAdded = 'RECENTLY_ADDED',
}

const RecentsQueryKey = (
	key: RecentsQueryKeys,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
) => [key, user?.id, MusicLibraryQueryKey(library?.musicLibraryId)]

export const RecentlyPlayedTracksQueryKey = (
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
) => RecentsQueryKey(RecentsQueryKeys.RecentlyPlayedTracks, user, library)

export const RecentlyPlayedArtistsQueryKey = (
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
) => RecentsQueryKey(RecentsQueryKeys.RecentlyPlayedArtists, user, library)

export const RecentlyAddedQueryKey = (
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
) => RecentsQueryKey(RecentsQueryKeys.RecentlyAdded, user, library)
