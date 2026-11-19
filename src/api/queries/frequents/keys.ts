import { JellifyLibrary } from '../../../types/JellifyLibrary'
import { JellifyUser } from '../../../types/JellifyUser'
import { MusicLibraryQueryKey } from '../libraries/keys'

enum FrequentsQueryKeys {
	FrequentlyPlayedTracks = 'FREQUENTLY_PLAYED_TRACKS_200',
	FrequentlyPlayedArtists = 'FREQUENTLY_PLAYED_ARTISTS_200',
}

const FrequentsQueryKey = (
	key: FrequentsQueryKeys,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
) => [key, user?.id, MusicLibraryQueryKey(library?.musicLibraryId)]

export const FrequentlyPlayedTracksQueryKey = (
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
) => FrequentsQueryKey(FrequentsQueryKeys.FrequentlyPlayedTracks, user, library)

export const FrequentlyPlayedArtistsQueryKey = (
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
) => FrequentsQueryKey(FrequentsQueryKeys.FrequentlyPlayedArtists, user, library)
