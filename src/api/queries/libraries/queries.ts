import { Api } from '@jellyfin/sdk'
import { LibrariesQueryKey, LibraryQueryKeys, PlaylistLibraryQueryKey } from './keys'
import { fetchPlaylistLibrary, fetchUserViews } from './utils'
import { JellifyUser } from '../../../types/JellifyUser'
import { UndefinedInitialDataOptions } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'

export const LibrariesQuery = (api: Api | undefined, user: JellifyUser | undefined) =>
	({
		queryKey: LibrariesQueryKey(api, user),
		queryFn: () => fetchUserViews(api!, user!),
		staleTime: 0, // Refetch on mount
		enabled: Boolean(api && user),
	}) as UndefinedInitialDataOptions<BaseItemDto[], Error, BaseItemDto[]>

export const PlaylistLibraryQuery = (api: Api | undefined, user: JellifyUser | undefined) =>
	({
		queryKey: PlaylistLibraryQueryKey(api, user),
		queryFn: () => fetchPlaylistLibrary(api!, user!),
		staleTime: Infinity,
		enabled: Boolean(api && user),
	}) as UndefinedInitialDataOptions<BaseItemDto | undefined, Error, BaseItemDto | undefined>
