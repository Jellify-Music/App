import { JellifyLibrary } from '@/src/types/JellifyLibrary'

enum PlaylistQueryKeys {
	UserPlaylists,
	PublicPlaylists,
}

export const UserPlaylistsQueryKey = (library: JellifyLibrary | undefined) => [
	PlaylistQueryKeys.UserPlaylists,
	library?.playlistLibraryId,
]

export const PublicPlaylistsQueryKey = (library: JellifyLibrary | undefined) => [
	PlaylistQueryKeys.PublicPlaylists,
	library?.playlistLibraryId,
]
