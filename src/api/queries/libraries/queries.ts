import { Api } from '@jellyfin/sdk'
import { LibrariesQueryKey, PlaylistLibraryQueryKey } from './keys'
import { fetchPlaylistLibrary, fetchUserViews } from './utils'
import { JellifyUser } from '../../../types/JellifyUser'

export const LibrariesQuery = (api: Api | undefined, user: JellifyUser | undefined) => ({
	queryKey: LibrariesQueryKey(api),
	queryFn: () => fetchUserViews(api, user),
	staleTime: 0, // Refetch on mount
})

export const PlaylistLibraryQuery = (api: Api | undefined, user: JellifyUser | undefined) => ({
	queryKey: PlaylistLibraryQueryKey(api, user),
	queryFn: () => fetchPlaylistLibrary(api, user),
	staleTime: Infinity, // Refetch on mount
})
