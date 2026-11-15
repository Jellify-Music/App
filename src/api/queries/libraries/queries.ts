import { LibrariesQueryKey, PlaylistLibraryQueryKey } from './keys'
import { fetchPlaylistLibrary, fetchMusicLibraries } from './utils'
import { UndefinedInitialDataOptions } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { getApi, getUser } from '../../../stores/auth/utils'

export const LibrariesQuery = () =>
	({
		queryKey: LibrariesQueryKey(getApi(), getUser()),
		queryFn: ({ signal }) => fetchMusicLibraries(getApi(), getUser(), signal),
		staleTime: 0, // Refetch on mount
		enabled: Boolean(getApi() && getUser()),
	}) as UndefinedInitialDataOptions<BaseItemDto[], Error, BaseItemDto[]>

export const PlaylistLibraryQuery = () =>
	({
		queryKey: PlaylistLibraryQueryKey(getApi(), getUser()),
		queryFn: ({ signal }) => fetchPlaylistLibrary(getApi(), getUser(), signal),
		staleTime: Infinity,
		enabled: Boolean(getApi() && getUser()),
	}) as UndefinedInitialDataOptions<BaseItemDto | undefined, Error, BaseItemDto | undefined>
