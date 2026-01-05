import { JellifyLibrary } from '@/src/types/JellifyLibrary'
import { JellifyUser } from '@/src/types/JellifyUser'

enum RecentsQueryKeys {
	RecentlyPlayedTracks = 'RECENTLY_PLAYED_TRACKS',
	RecentlyPlayedArtists = 'RECENTLY_PLAYED_ARTISTS',
	RecentlyAdded = 'RECENTLY_ADDED',
}

const RecentsQueryKey = (
	key: RecentsQueryKeys,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
) => [key, user?.id, library?.musicLibraryId]

export const RecentlyPlayedTracksQueryKey = (
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
) => RecentsQueryKey(RecentsQueryKeys.RecentlyPlayedTracks, user, library)

export const RecentlyPlayedArtistsQueryKey = (
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
) => RecentsQueryKey(RecentsQueryKeys.RecentlyPlayedArtists, user, library)
