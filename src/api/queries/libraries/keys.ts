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
