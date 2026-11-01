import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { queryOptions } from '@tanstack/react-query'
import { PlaylistTracksQueryKey, PublicPlaylistsQueryKey, UserPlaylistsQueryKey } from './keys'
import { fetchPlaylistTracks, fetchPublicPlaylists, fetchUserPlaylists } from './utils'
import { getApi, getUser } from '../../../stores/auth/utils'
import { JellifyUser } from '../../../types/JellifyUser'

export const UserPlaylistsQuery = (user: JellifyUser | undefined = getUser()) =>
	queryOptions({
		queryKey: UserPlaylistsQueryKey(user),
		queryFn: ({ signal }) => fetchUserPlaylists(signal, user),
		enabled: Boolean(getApi() && user),
	})

export const PublicPlaylistsQuery = () =>
	queryOptions({
		queryKey: PublicPlaylistsQueryKey(),
		queryFn: ({ signal }) => fetchPublicPlaylists(signal),
		enabled: Boolean(getApi()),
	})

export const PlaylistTracksQuery = (playlist: BaseItemDto) =>
	queryOptions({
		queryKey: PlaylistTracksQueryKey(playlist),
		queryFn: ({ signal }) => fetchPlaylistTracks(playlist.Id!, signal),
		enabled: Boolean(getApi() && playlist.Id),
	})
