import { QueryKeys } from '../../../enums/query-keys'
import { JellifyUser } from '@/src/types/JellifyUser'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'

enum PlaylistQueryKeys {
	UserPlaylists,
	PublicPlaylists,
}

export const UserPlaylistsQueryKey = (
	library: BaseItemDto | undefined,
	user: JellifyUser | undefined,
) => [PlaylistQueryKeys.UserPlaylists, library?.Id, user?.id]

export const PlaylistTracksQueryKey = (playlist: BaseItemDto) => [
	QueryKeys.ItemTracks,
	'infinite',
	playlist.Id!,
]

export const PublicPlaylistsQueryKey = (library: BaseItemDto | undefined) => [
	PlaylistQueryKeys.PublicPlaylists,
	library?.Id,
]
