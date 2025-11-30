import { JellifyLibrary } from '@/src/types/JellifyLibrary'
import { QueryKeys } from '../../../enums/query-keys'

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

/**
 * Query key for fetching tracks of a specific playlist.
 * Use this for cache invalidation after playlist mutations.
 */
export const PlaylistTracksQueryKey = (playlistId: string) => [QueryKeys.ItemTracks, playlistId]
