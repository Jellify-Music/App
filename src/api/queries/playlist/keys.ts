import { JellifyUser } from '@/src/types/JellifyUser'
import { PlaylistTypes } from '../../../types/playlist'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'

enum PlaylistQueryKeys {
	Playlists = 'PLAYLISTS',
	PublicPlaylists = 'PUBLIC_PLAYLISTS',
	PlaylistUsers = 'PLAYLIST_USERS',
}

/**
 * Every playlist query lives under this root, so invalidating it
 * refreshes the user playlists, public playlists and all playlist tracks
 */
export const PlaylistsQueryKey = [PlaylistQueryKeys.Playlists]

export const UserPlaylistsQueryKey = (user: JellifyUser | undefined) => [
	...PlaylistsQueryKey,
	PlaylistTypes.User,
	user?.id,
]

export const PublicPlaylistsQueryKey = () => [...PlaylistsQueryKey, PlaylistTypes.Public]

/**
 * A playlist's tracks are shared between the user and public playlist caches,
 * since the contents are the same regardless of where the playlist was listed
 */
export const PlaylistTracksQueryKey = (playlist: BaseItemDto) => [
	...PlaylistsQueryKey,
	'tracks',
	playlist.Id!,
]

export const PlaylistUsersQueryKey = (playlist: BaseItemDto) => [
	PlaylistQueryKeys.PlaylistUsers,
	playlist.Id,
]
