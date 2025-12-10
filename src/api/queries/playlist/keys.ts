import { JellifyLibrary } from '@/src/types/JellifyLibrary'

enum PlaylistQueryKeys {
	UserPlaylists,
	PublicPlaylists,
}

export const UserPlaylistsQueryKey = (library: JellifyLibrary | undefined, searchTerm?: string) => [
	PlaylistQueryKeys.UserPlaylists,
	library?.playlistLibraryId,
	searchTerm,
]

export const PublicPlaylistsQueryKey = (library: JellifyLibrary | undefined) => [
	PlaylistQueryKeys.PublicPlaylists,
	library?.playlistLibraryId,
]
