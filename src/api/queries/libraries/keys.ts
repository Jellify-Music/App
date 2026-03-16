import { JellifyUser } from '@/src/types/JellifyUser'
import { Api } from '@jellyfin/sdk'

enum LibraryQueryKeys {
	Libraries,
	PlaylistLibrary,
}

export const LibrariesQueryKey = (api: Api | undefined) => [
	LibraryQueryKeys.Libraries,
	api?.basePath,
]

export const PlaylistLibraryQueryKey = (api: Api | undefined, user: JellifyUser | undefined) => [
	LibraryQueryKeys.PlaylistLibrary,
	api?.basePath,
	user?.id,
]
