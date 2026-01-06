import { QueryKeys } from '../../../enums/query-keys'
import { JellifyLibrary } from '@/src/types/JellifyLibrary'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'

enum PlaylistQueryKeys {
	UserPlaylists,
	PublicPlaylists,
}

export const UserPlaylistsQueryKey = (library: JellifyLibrary | undefined) => [
	PlaylistQueryKeys.UserPlaylists,
	library?.playlistLibraryId,
]

export const PlaylistTracksQueryKey = (playlist: BaseItemDto) => [
	QueryKeys.ItemTracks,
	'infinite',
	playlist.Id!,
]

export const PublicPlaylistsQueryKey = (library: JellifyLibrary | undefined) => [
	PlaylistQueryKeys.PublicPlaylists,
	library?.playlistLibraryId,
]
