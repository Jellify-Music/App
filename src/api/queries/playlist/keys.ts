import { QueryKeys } from '../../../enums/query-keys'
import { JellifyUser } from '@/src/types/JellifyUser'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'

enum PlaylistQueryKeys {
	UserPlaylists,
	PublicPlaylists,
}

export const UserPlaylistsQueryKey = (user: JellifyUser | undefined) => [
	PlaylistQueryKeys.UserPlaylists,
	user?.id,
]

export const PlaylistTracksQueryKey = (playlist: BaseItemDto) => [
	QueryKeys.ItemTracks,
	'infinite',
	playlist.Id!,
]

export const PublicPlaylistsQueryKey = () => [PlaylistQueryKeys.PublicPlaylists]
