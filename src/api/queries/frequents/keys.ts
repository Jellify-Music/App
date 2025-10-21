import { JellifyLibrary } from '@/src/types/JellifyLibrary'
import { JellifyUser } from '@/src/types/JellifyUser'

enum FrequentsQueryKeys {
	FrequentlyPlayedTracks = 'FREQUENTLY_PLAYED_TRACKS',
	FrequentlyPlayedArtists = 'FREQUENTLY_PLAYED_ARTISTS',
}

const FrequentsQueryKey = (
	key: FrequentsQueryKeys,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
) => [key, user?.id, library?.musicLibraryId]

export const FrequentlyPlayedTracksQueryKey = (
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
) => FrequentsQueryKey(FrequentsQueryKeys.FrequentlyPlayedTracks, user, library)

export const FrequentlyPlayedArtistsQueryKey = (
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
) => FrequentsQueryKey(FrequentsQueryKeys.FrequentlyPlayedArtists, user, library)
