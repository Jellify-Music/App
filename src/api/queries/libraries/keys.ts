import { JellifyUser } from '@/src/types/JellifyUser'
import { Api } from '@jellyfin/sdk'

export enum LibraryQueryKeys {
	Libraries,
	PlaylistLibrary,
}

export const LibrariesQueryKey = (api: Api | undefined, user: JellifyUser | undefined) => [
	LibraryQueryKeys.Libraries,
	api?.basePath,
	user?.id,
]

export const PlaylistLibraryQueryKey = (api: Api | undefined, user: JellifyUser | undefined) => [
	LibraryQueryKeys.PlaylistLibrary,
	api?.basePath,
	user?.id,
]

/**
 * Query key segment used in place of a music library ID when no music library is selected.
 *
 * Without a selected library, Jellify queries every music library the user can access.
 * A named value keeps those query keys stable, since `undefined` would be persisted as `null`.
 */
export const ALL_MUSIC_LIBRARIES = 'ALL_MUSIC_LIBRARIES'

/**
 * @param libraryId The ID of the selected music library, if there is one
 * @returns The music library segment of a query key
 */
export const MusicLibraryQueryKey = (libraryId: string | undefined) =>
	libraryId ?? ALL_MUSIC_LIBRARIES
